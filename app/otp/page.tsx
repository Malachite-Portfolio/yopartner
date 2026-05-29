"use client";

import { ArrowLeft, BadgeCheck, Lock, PencilLine, ShieldCheck } from "lucide-react";
import Link from "next/link";
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
import {
  OTP_RESEND_AVAILABLE_AT_KEY,
  clearPendingUserPhone,
  getPendingUserPhone,
  resolvePostAuthDestination,
} from "@/lib/auth/onboarding";
import { IS_PRODUCTION_READY_MODE } from "@/lib/config/runtime";
import { getDemoPhone, setDemoLoggedIn } from "@/lib/demoAuth";
import { maskIndianPhoneNumber } from "@/lib/phoneMask";
import { getUserAuthState, saveUserAuthSession } from "@/lib/auth/userAuth";
import { normalizeUserPhone } from "@/lib/auth/userIdentity";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 28;

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
    const pendingPhone = normalizeUserPhone(getPendingUserPhone());
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
          normalizeUserPhone(getPendingUserPhone()) ||
          normalizeUserPhone(phone);

        saveUserAuthSession({
          uid: user.uid,
          phone: verifiedPhone,
          token: idToken,
        });

        clearPendingConfirmationResult();
        clearPendingUserPhone();
        clearResendAvailableAt();
        setAuthMode("firebase");
        setMessage("Verification successful. Redirecting...");

        const destination = await resolvePostAuthDestination("/connect-now");
        router.push(destination.destination);
      } catch (verifyError) {
        setError(mapFirebaseAuthError(verifyError));
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    setDemoLoggedIn(true);
    setAuthMode("demo");
    clearPendingUserPhone();
    clearResendAvailableAt();
    setError("");
    setMessage("Verification successful. Redirecting...");

    const destination = await resolvePostAuthDestination("/connect-now");
    router.push(destination.destination);
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

    const resendPhone = normalizeUserPhone(getPendingUserPhone()) || normalizeUserPhone(phone);
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
    <section className="flex min-h-screen items-center justify-center bg-[#f4fbf7] px-4 py-10">
      <div className="w-full max-w-[460px] rounded-3xl border border-[#dceee6] bg-[#fffefb] p-6 shadow-[0_20px_65px_-40px_rgba(0,0,0,0.35)] sm:p-8">
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="inline-flex items-center gap-1 text-sm font-medium text-[#2e6558] hover:text-[#127e6d]"
        >
          <ArrowLeft size={15} />
          Back
        </button>

        <div className="mt-4 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.png" alt="YoPartner" className="mx-auto h-auto max-h-11 w-auto object-contain" />
          <div className="mt-5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#267f71]">
            <span className="rounded-full bg-[#d9f2ea] px-2 py-1">Step 2</span>
            <div className="h-1 flex-1 rounded-full bg-[#e4f4ee]">
              <div className="h-1 w-2/3 rounded-full bg-[#1d8a76]" />
            </div>
            <span>3</span>
          </div>

          <h1 className="mt-4 text-3xl font-semibold text-[#16382f]">Verify Your Number</h1>
          <p className="mt-2 text-sm text-[#5b7269]">Enter the 6-digit code sent to</p>
          <p className="mt-1 text-sm font-semibold text-[#16382f]">{maskIndianPhoneNumber(phone)}</p>
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
              className="h-12 rounded-xl border border-[#cfe4db] bg-[#f8fcfa] text-center text-lg font-semibold outline-none focus:border-[#1d8a76]"
            />
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between text-xs">
          {mode === "firebase" && resendSeconds > 0 ? (
            <p className="text-[#5b7269]">Resend code in {resendSeconds}s</p>
          ) : (
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={!canResend}
              className="font-semibold text-[#127e6d] disabled:cursor-not-allowed disabled:text-slate-400"
            >
              {isResending ? "Sending..." : "Resend code"}
            </button>
          )}

          <Link href="/login" className="inline-flex items-center gap-1 font-semibold text-[#127e6d]">
            <PencilLine size={12} />
            Edit phone number
          </Link>
        </div>

        <button
          type="button"
          onClick={handleVerify}
          disabled={!isComplete || isSubmitting}
          className={`mt-5 h-12 w-full rounded-2xl text-sm font-semibold text-white ${
            isComplete && !isSubmitting ? "bg-[#127e6d] hover:bg-[#0f6e5f]" : "bg-slate-300"
          }`}
        >
          {isSubmitting ? "Verifying..." : "Verify & Continue"}
        </button>

        {message ? <p className="mt-3 text-xs font-medium text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-1 text-xs font-medium text-rose-600">{error}</p> : null}

        {IS_PRODUCTION_READY_MODE && firebaseEnabled && !pendingConfirmation ? (
          <p className="mt-2 text-xs font-medium text-rose-600">OTP session expired. Please request a new OTP.</p>
        ) : null}
        {mode === "firebase" ? <div id="otp-recaptcha-container" className="pt-1" /> : null}

        <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl border border-[#d8ebe3] bg-[#f7fcfa] p-3 text-[11px] font-medium text-[#3d5e53]">
          <p className="inline-flex items-center gap-1">
            <ShieldCheck size={13} className="text-[#1b8d7a]" />
            Secure
          </p>
          <p className="inline-flex items-center gap-1">
            <Lock size={13} className="text-[#1b8d7a]" />
            Private
          </p>
          <p className="inline-flex items-center gap-1">
            <BadgeCheck size={13} className="text-[#1b8d7a]" />
            Trusted
          </p>
        </div>
      </div>
    </section>
  );
}
