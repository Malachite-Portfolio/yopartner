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
import { getDemoPhone, setDemoLoggedIn } from "@/lib/demoAuth";

const OTP_LENGTH = 6;

function maskPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const suffix = digits.slice(-3);
  return `+*********${suffix || "363"}`;
}

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

  const phone = useMemo(() => (typeof window !== "undefined" ? getDemoPhone() : "+919958719363"), []);
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
          setError("Firebase Admin is not configured. Please use Demo OTP mode.");
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
          window.localStorage.setItem(USER_FIREBASE_UID_KEY, user.uid);
          window.localStorage.setItem(USER_FIREBASE_PHONE_KEY, phone);
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
    <div className="min-h-screen bg-white lg:grid lg:grid-cols-2">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#2563EB] via-[#9B5DE5] to-[#f97316] p-7 text-white sm:p-10">
        <div className="relative z-10">
          <h1 className="text-4xl font-semibold sm:text-5xl">Welcome to YoPartner</h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-white/90 sm:text-base">
            Continue your journey with our trusted companionship platform. Your security and privacy are our top priorities.
          </p>

          <div className="mt-10 rounded-3xl border border-white/25 bg-white/10 p-8 backdrop-blur-sm">
            <p className="text-7xl">🔐</p>
            <p className="mt-4 text-3xl font-semibold">Premium Experience</p>
            <p className="mt-2 max-w-lg text-sm text-white/90">
              Access premium features and priority support with our platform.
            </p>
          </div>
        </div>

        <div className="pointer-events-none absolute -bottom-20 -right-16 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
      </section>

      <section className="flex items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
          <h2 className="text-3xl font-semibold text-slate-900">Verify Your Number</h2>
          <p className="mt-2 text-sm text-slate-600">We&apos;ve sent a verification code to</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{maskPhone(phone)}</p>
          <p className="mt-1 text-xs text-slate-500">OTP will arrive via SMS on your mobile number</p>

          <div className="mt-5 grid grid-cols-6 gap-2">
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

          {message && <p className="mt-3 text-xs font-medium text-emerald-700">{message}</p>}
          {error ? <p className="mt-1 text-xs font-medium text-rose-600">{error}</p> : null}
          <p className="mt-2 inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
            {mode === "firebase" ? "Firebase OTP" : "Demo OTP"}
          </p>

          <p className="mt-5 inline-flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck size={14} className="text-emerald-600" />
            Encrypted verification for your account safety.
          </p>
        </div>
      </section>
    </div>
  );
}
