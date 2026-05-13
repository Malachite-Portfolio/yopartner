"use client";

import { ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PARTNER_FIREBASE_PHONE_KEY,
  PARTNER_FIREBASE_TOKEN_KEY,
  PARTNER_FIREBASE_UID_KEY,
  clearPendingConfirmationResult,
  getAuthMode,
  getPendingConfirmationResult,
  isFirebaseOtpEnabled,
  mapFirebaseAuthError,
  setAuthMode,
  verifyOtp,
} from "@/lib/auth/firebasePhoneAuth";
import {
  PARTNER_LOGGED_IN_KEY,
  PARTNER_PHONE_KEY,
  getPartnerPhone,
  isPartnerOnboardingComplete,
  loginPartner,
} from "@/lib/partnerAuth";

function maskPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const suffix = digits.slice(-4);
  return `+91******${suffix || "9363"}`;
}

export default function PartnerOtpPage() {
  const router = useRouter();
  const phone = getPartnerPhone();
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const otpValue = useMemo(() => digits.join(""), [digits]);
  const firebaseEnabled = isFirebaseOtpEnabled();
  const mode =
    firebaseEnabled && (getAuthMode() === "firebase" || Boolean(getPendingConfirmationResult()))
      ? "firebase"
      : "demo";

  useEffect(() => {
    if (!phone) {
      router.replace("/partner/login");
    }
  }, [phone, router]);

  const updateDigit = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    setError("");
    setDigits((current) => current.map((digit, i) => (i === index ? value : digit)));
    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    if (otpValue.length !== 6) {
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
      try {
        const user = await verifyOtp(confirmation, otpValue);
        const idToken = await user.getIdToken();

        const sessionResponse = await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken, role: "partner" }),
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

        loginPartner(phone);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(PARTNER_LOGGED_IN_KEY, "true");
          window.localStorage.setItem(PARTNER_PHONE_KEY, phone);
          window.localStorage.setItem(PARTNER_FIREBASE_UID_KEY, user.uid);
          window.localStorage.setItem(PARTNER_FIREBASE_PHONE_KEY, phone);
          window.localStorage.setItem(PARTNER_FIREBASE_TOKEN_KEY, idToken);
        }

        clearPendingConfirmationResult();
        setAuthMode("firebase");
        if (isPartnerOnboardingComplete()) {
          router.replace("/partner/dashboard");
          return;
        }
        router.replace("/partner/onboarding");
      } catch (verifyError) {
        setError(mapFirebaseAuthError(verifyError));
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    setError("");
    loginPartner(phone);
    setAuthMode("demo");
    if (isPartnerOnboardingComplete()) {
      router.replace("/partner/dashboard");
      return;
    }
    router.replace("/partner/onboarding");
  };

  return (
    <section className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#eff6ff] via-[#f8fafc] to-[#ecfeff] px-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/partner/login"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600"
          >
            <ArrowLeft size={16} />
          </Link>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.png" alt="YoPartner" className="h-auto max-h-11 w-auto object-contain" />
          <span className="w-9" />
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-semibold text-slate-900">Verify Partner Number</h1>
          <p className="mt-2 text-sm text-slate-600">Enter the 6-digit OTP sent to your phone.</p>
          <p className="mt-1 text-sm font-semibold text-slate-800">{maskPhone(phone)}</p>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(element) => {
                inputsRef.current[index] = element;
              }}
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(event) => updateDigit(index, event.target.value)}
              onKeyDown={(event) => handleKeyDown(index, event)}
              className="h-12 w-11 rounded-xl border border-slate-200 text-center text-lg font-semibold text-slate-800 outline-none focus:border-[#2563eb]"
            />
          ))}
        </div>

        <button
          type="button"
          onClick={handleVerify}
          disabled={otpValue.length !== 6 || isSubmitting}
          className="mt-6 h-11 w-full rounded-xl bg-gradient-to-r from-[#1d4ed8] to-[#0ea5a6] text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-55"
        >
          {isSubmitting ? "Verifying..." : "Verify"}
        </button>
        {error ? <p className="mt-2 text-xs font-medium text-rose-600">{error}</p> : null}
        <p className="mt-2 inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
          {mode === "firebase" ? "Firebase OTP" : "Demo OTP"}
        </p>

        <p className="mt-4 inline-flex items-center gap-1 text-xs text-slate-500">
          <ShieldCheck size={13} />
          {mode === "firebase" ? "Firebase OTP verification enabled." : "Demo OTP flow only. No real OTP verification is used."}
        </p>
      </div>
    </section>
  );
}
