"use client";

import { ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  USER_FIREBASE_PHONE_KEY,
  USER_FIREBASE_TOKEN_KEY,
  USER_FIREBASE_UID_KEY,
  clearPendingConfirmationResult,
  getAuthMode,
  getPendingConfirmationResult,
  isFirebaseOtpEnabled,
  mapFirebaseAuthError,
  setAuthMode,
  verifyOtp,
} from "@/lib/auth/firebasePhoneAuth";
import { IS_PRODUCTION_READY_MODE } from "@/lib/config/runtime";
import { getDemoPhone, setDemoLoggedIn } from "@/lib/demoAuth";
import { maskIndianPhoneNumber } from "@/lib/phoneMask";

const OTP_LENGTH = 6;

export default function OtpPage() {
  const router = useRouter();
  const [otp, setOtp] = useState<string[]>(Array.from({ length: OTP_LENGTH }, () => ""));
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const firebaseEnabled = isFirebaseOtpEnabled();
  const mode =
    firebaseEnabled && (getAuthMode() === "firebase" || Boolean(getPendingConfirmationResult()))
      ? "firebase"
      : "demo";

  const phone = useMemo(() => {
    if (typeof window === "undefined") return "";
    const firebasePhone = window.localStorage.getItem(USER_FIREBASE_PHONE_KEY);
    return firebasePhone || getDemoPhone();
  }, []);
  const isComplete = otp.every((digit) => digit.length === 1);

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
    if (IS_PRODUCTION_READY_MODE && mode !== "firebase") {
      setError("Authentication is not configured. Please contact support.");
      return;
    }

    if (!isComplete) {
      setError("Please enter the complete 6-digit OTP.");
      return;
    }

    if (mode === "firebase") {
      const confirmation = getPendingConfirmationResult();
      if (!confirmation) {
        setError("OTP session expired. Please request a new OTP.");
        return;
      }

      setIsSubmitting(true);
      setError("");
      setMessage("");
      try {
        const otpValue = otp.join("");
        const user = await verifyOtp(confirmation, otpValue);
        const idToken = await user.getIdToken();

        const sessionResponse = await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idToken,
            role: "user",
          }),
        });

        if (sessionResponse.status === 503) {
          setError(
            IS_PRODUCTION_READY_MODE
              ? "Authentication is not configured. Please contact support."
              : "Firebase Admin is not configured. Please use Demo OTP mode.",
          );
          setIsSubmitting(false);
          return;
        }

        if (!sessionResponse.ok) {
          setError("Unable to create session. Please try again.");
          setIsSubmitting(false);
          return;
        }

        setDemoLoggedIn(true);
        if (typeof window !== "undefined") {
          const normalizedPhone = phone.replace(/\D/g, "").slice(-10);
          const phoneValue = normalizedPhone.length === 10 ? `+91${normalizedPhone}` : phone;
          window.localStorage.setItem(USER_FIREBASE_UID_KEY, user.uid);
          window.localStorage.setItem(USER_FIREBASE_PHONE_KEY, phoneValue);
          window.localStorage.setItem(USER_FIREBASE_TOKEN_KEY, idToken);
        }

        clearPendingConfirmationResult();
        setAuthMode("firebase");
        setMessage("Verification successful. Redirecting...");
        setTimeout(() => {
          router.push("/connect-now");
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
    setError("");
    setMessage("Verification successful. Redirecting...");
    setTimeout(() => {
      router.push("/connect-now");
    }, 400);
  };

  return (
    <section className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-4 py-10">
      <div className="w-full max-w-[420px] rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
        <div className="text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.png" alt="YoPartner" className="mx-auto h-auto max-h-11 w-auto object-contain" />
          <h1 className="mt-4 text-2xl font-semibold text-slate-900">Verify your number</h1>
          <p className="mt-1 text-sm text-slate-600">Enter the 6-digit code sent to your phone.</p>
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

        <p className="mt-3 text-xs text-slate-500">Resend code in 28s</p>

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
          {mode === "firebase" ? "Firebase OTP" : IS_PRODUCTION_READY_MODE ? "OTP Unavailable" : "Demo OTP"}
        </p>

        <p className="mt-5 inline-flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck size={14} className="text-emerald-600" />
          Secure verification powered by Firebase OTP.
        </p>
      </div>
    </section>
  );
}

