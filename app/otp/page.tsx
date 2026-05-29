"use client";

import { ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  clearPendingConfirmationResult,
  getAuthMode,
  getPendingConfirmationResult,
  isFirebaseOtpEnabled,
  mapFirebaseAuthError,
  sendOtp,
  setAuthMode,
  setupRecaptcha,
  verifyOtp,
} from "@/lib/auth/firebasePhoneAuth";
import { IS_PRODUCTION_READY_MODE } from "@/lib/config/runtime";
import { getDemoPhone, setDemoLoggedIn } from "@/lib/demoAuth";
import { maskIndianPhoneNumber } from "@/lib/phoneMask";
import { getUserAuthState, saveUserAuthSession } from "@/lib/auth/userAuth";
import { normalizeUserPhone } from "@/lib/auth/userIdentity";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 28;
const POST_LOGIN_REDIRECT_KEY = "yopartner_post_login_redirect";
const PENDING_USER_PHONE_KEY = "yopartner_pending_user_phone";
const OTP_RESEND_AVAILABLE_AT_KEY = "yopartner_otp_resend_available_at";

function getPostLoginRedirect() {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(POST_LOGIN_REDIRECT_KEY);
  if (!value || !value.startsWith("/")) return null;
  return value;
}

function consumePostLoginRedirect() {
  const redirect = getPostLoginRedirect();
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(POST_LOGIN_REDIRECT_KEY);
  }
  return redirect;
}

function getPendingPhone() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(PENDING_USER_PHONE_KEY) ?? "";
}

function clearPendingPhone() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PENDING_USER_PHONE_KEY);
}

function readResendAvailableAt() {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(OTP_RESEND_AVAILABLE_AT_KEY);
  if (!raw) return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}

function setResendAvailableAt(timestamp: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(OTP_RESEND_AVAILABLE_AT_KEY, String(timestamp));
}

function clearResendAvailableAt() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(OTP_RESEND_AVAILABLE_AT_KEY);
}

function createResendAvailableAt() {
  return Date.now() + RESEND_SECONDS * 1000;
}

export default function OtpPage() {
  const router = useRouter();
  const firebaseEnabled = isFirebaseOtpEnabled();
  const pendingConfirmation = getPendingConfirmationResult();
  const mode =
    firebaseEnabled && (getAuthMode() === "firebase" || Boolean(pendingConfirmation))
      ? "firebase"
      : "demo";
  const [otp, setOtp] = useState<string[]>(Array.from({ length: OTP_LENGTH }, () => ""));
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendAvailableAt, setResendAvailableAtState] = useState<number | null>(() => {
    if (!firebaseEnabled || typeof window === "undefined") return null;
    const existing = readResendAvailableAt();
    if (existing && existing > Date.now()) return existing;
    return createResendAvailableAt();
  });
  const [resendSeconds, setResendSeconds] = useState(() => {
    if (!firebaseEnabled || typeof window === "undefined") return 0;
    const existing = readResendAvailableAt();
    const target = existing && existing > Date.now() ? existing : createResendAvailableAt();
    return Math.max(0, Math.ceil((target - Date.now()) / 1000));
  });

  const phone = useMemo(() => {
    if (typeof window === "undefined") return "";
    const pendingPhone = normalizeUserPhone(getPendingPhone());
    if (pendingPhone) return pendingPhone;
    const authPhone = normalizeUserPhone(getUserAuthState().phone);
    if (authPhone) return authPhone;
    return normalizeUserPhone(getDemoPhone()) ?? "";
  }, []);
  const isComplete = otp.every((digit) => digit.length === 1);
  const canResend = resendSeconds <= 0 && !isResending && !isSubmitting;

  useEffect(() => {
    if (!resendAvailableAt) return;
    setResendAvailableAt(resendAvailableAt);
  }, [resendAvailableAt]);

  useEffect(() => {
    if (!resendAvailableAt) return;

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((resendAvailableAt - Date.now()) / 1000));
      setResendSeconds(remaining);
      if (remaining === 0) {
        clearResendAvailableAt();
        setResendAvailableAtState(null);
      }
    };

    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [resendAvailableAt]);

  const updateDigit = (index: number, value: string) => {
    const sanitized = value.replace(/[^0-9]/g, "").slice(-1);
    setError("");
    setOtp((prev) => {
      const next = [...prev];
      next[index] = sanitized;
      return next;
    });

    if (sanitized && index < OTP_LENGTH - 1) {
      const nextInput = document.getElementById(`otp-${index + 1}`) as HTMLInputElement | null;
      nextInput?.focus();
    }
  };

  const handleVerify = async () => {
    if (IS_PRODUCTION_READY_MODE && !firebaseEnabled) {
      setError("Firebase OTP is not configured. Please check Vercel environment variables.");
      return;
    }

    if (IS_PRODUCTION_READY_MODE && !pendingConfirmation) {
      setError("OTP session expired. Please request a new OTP.");
      return;
    }

    if (!isComplete) {
      setError("Please enter the complete 6-digit OTP.");
      return;
    }

    if (mode === "firebase") {
      if (!pendingConfirmation) {
        setError("OTP session expired. Please request a new OTP.");
        return;
      }

      setIsSubmitting(true);
      setError("");
      setMessage("");
      try {
        const otpValue = otp.join("");
        const user = await verifyOtp(pendingConfirmation, otpValue);
        const idToken = await user.getIdToken(true);
        const verifiedPhone =
          normalizeUserPhone(user.phoneNumber) ||
          normalizeUserPhone(getPendingPhone()) ||
          normalizeUserPhone(phone);
        saveUserAuthSession({
          uid: user.uid,
          phone: verifiedPhone,
          token: idToken,
        });

        clearPendingConfirmationResult();
        clearPendingPhone();
        clearResendAvailableAt();
        setAuthMode("firebase");
        setMessage("Verification successful. Redirecting...");
        setTimeout(() => {
          const redirectTo = consumePostLoginRedirect() || "/connect-now";
          router.push(redirectTo);
        }, 300);
      } catch (verifyError) {
        setError(mapFirebaseAuthError(verifyError));
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    setDemoLoggedIn(true);
    setAuthMode("demo");
    clearPendingPhone();
    clearResendAvailableAt();
    setError("");
    setMessage("Verification successful. Redirecting...");
    setTimeout(() => {
      const redirectTo = consumePostLoginRedirect() || "/connect-now";
      router.push(redirectTo);
    }, 400);
  };

  const handleResendOtp = async () => {
    if (!canResend) return;

    if (mode !== "firebase") {
      const nextResendAt = createResendAvailableAt();
      setResendAvailableAt(nextResendAt);
      setResendAvailableAtState(nextResendAt);
      setMessage("A new code has been generated.");
      setError("");
      return;
    }

    const resendPhone = normalizeUserPhone(getPendingPhone()) || normalizeUserPhone(phone);
    if (!resendPhone) {
      setError("Phone number is missing. Please login again to request OTP.");
      return;
    }

    setIsResending(true);
    setError("");
    setMessage("");
    try {
      const verifier = setupRecaptcha("otp-recaptcha-container");
      if (!verifier) {
        setError("OTP service is not ready. Please try again.");
        return;
      }

      await sendOtp(resendPhone, verifier);
      setAuthMode("firebase");
      const nextResendAt = createResendAvailableAt();
      setResendAvailableAt(nextResendAt);
      setResendAvailableAtState(nextResendAt);
      setOtp(Array.from({ length: OTP_LENGTH }, () => ""));
      setMessage("A new OTP has been sent to your phone.");
    } catch (resendError) {
      setError(mapFirebaseAuthError(resendError));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <section className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-4 py-10">
      <div className="w-full max-w-[420px] rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
        <div className="text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.png" alt="YoPartner" className="mx-auto h-auto max-h-11 w-auto object-contain" />
          <h1 className="mt-4 text-2xl font-semibold text-slate-900">Verify your number</h1>
          <p className="mt-1 text-sm text-slate-600">Enter the secure 6-digit code sent to your phone.</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">{maskIndianPhoneNumber(phone)}</p>
        </div>

        <div className="mt-6 grid grid-cols-6 gap-2">
          {otp.map((digit, index) => (
            <input
              key={index}
              id={`otp-${index}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(event) => updateDigit(index, event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Backspace" && !otp[index] && index > 0) {
                  const prevInput = document.getElementById(`otp-${index - 1}`) as HTMLInputElement | null;
                  prevInput?.focus();
                }
              }}
              className="h-12 rounded-xl border border-slate-300 text-center text-lg font-semibold outline-none focus:border-[#2563EB]"
            />
          ))}
        </div>

        <div className="mt-3">
          {mode === "firebase" && resendSeconds > 0 ? (
            <p className="text-xs text-slate-500">Resend code in {resendSeconds}s</p>
          ) : (
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={!canResend}
              className="text-xs font-semibold text-[#2563EB] disabled:cursor-not-allowed disabled:text-slate-400"
            >
              {isResending ? "Sending..." : "Resend code"}
            </button>
          )}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleVerify}
            disabled={!isComplete || isSubmitting}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white ${
              isComplete && !isSubmitting ? "bg-[#2563EB]" : "bg-slate-300"
            }`}
          >
            {isSubmitting ? "Verifying..." : "Verify"}
          </button>
        </div>

        {message ? <p className="mt-3 text-xs font-medium text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-1 text-xs font-medium text-rose-600">{error}</p> : null}
        <p className="mt-2 inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
          {mode === "firebase" ? "Firebase OTP" : IS_PRODUCTION_READY_MODE ? "Firebase OTP Required" : "Demo OTP"}
        </p>
        {IS_PRODUCTION_READY_MODE && firebaseEnabled && !pendingConfirmation ? (
          <p className="mt-1 text-xs font-medium text-rose-600">OTP session expired. Please request a new OTP.</p>
        ) : null}
        {mode === "firebase" ? <div id="otp-recaptcha-container" className="pt-1" /> : null}

        <p className="mt-5 inline-flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck size={14} className="text-emerald-600" />
          Secure verification powered by Firebase OTP.
        </p>
      </div>
    </section>
  );
}

