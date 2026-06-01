"use client";

import { ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PARTNER_FIREBASE_PHONE_KEY,
  PARTNER_FIREBASE_UID_KEY,
  clearPendingConfirmationResult,
  getAuthMode,
  setPartnerStoredFirebaseToken,
  getPendingConfirmationResult,
  isFirebaseOtpEnabled,
  mapFirebaseAuthError,
  setAuthMode,
  verifyOtp,
} from "@/lib/auth/firebasePhoneAuth";
import {
  activateClientDemoPartnerSession,
  CLIENT_DEMO_OTP,
  getClientDemoPartnerPendingPhone,
  isClientDemoEnabled,
  isClientDemoPartnerPhone,
} from "@/lib/clientDemoData";
import { IS_PRODUCTION_READY_MODE } from "@/lib/config/runtime";
import { resolvePartnerLandingRoute } from "@/lib/partnerApproval";
import {
  PARTNER_LOGGED_IN_KEY,
  PARTNER_PHONE_KEY,
  getPartnerPhone,
  loginPartner,
} from "@/lib/partnerAuth";
import { maskIndianPhoneNumber } from "@/lib/phoneMask";

export default function PartnerOtpPage() {
  const router = useRouter();
  const phone = getPartnerPhone() || getClientDemoPartnerPendingPhone();
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const otpValue = useMemo(() => digits.join(""), [digits]);
  const firebaseEnabled = isFirebaseOtpEnabled();
  const pendingConfirmation = getPendingConfirmationResult();
  const mode =
    firebaseEnabled && (getAuthMode() === "firebase" || Boolean(pendingConfirmation))
      ? "firebase"
      : "demo";
  const isClientDemoOtpFlow = isClientDemoEnabled() && isClientDemoPartnerPhone(phone);
  const showOtpSessionExpiredHint =
    IS_PRODUCTION_READY_MODE &&
    firebaseEnabled &&
    mode === "firebase" &&
    !pendingConfirmation &&
    !isClientDemoOtpFlow;

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
    if (isClientDemoOtpFlow) {
      if (otpValue.length !== 6) {
        setError("Please enter the complete 6-digit OTP.");
        return;
      }
      if (otpValue !== CLIENT_DEMO_OTP) {
        setError("Invalid OTP. Please check and try again.");
        return;
      }
      setError("");
      activateClientDemoPartnerSession();
      clearPendingConfirmationResult();
      setAuthMode("demo");
      router.replace("/partner/dashboard");
      return;
    }

    if (IS_PRODUCTION_READY_MODE && !firebaseEnabled) {
      setError("Firebase OTP is not configured. Please check Vercel environment variables.");
      return;
    }

    if (IS_PRODUCTION_READY_MODE && !pendingConfirmation) {
      setError("OTP session expired. Please request a new OTP.");
      return;
    }

    if (otpValue.length !== 6) {
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
      try {
        const user = await verifyOtp(pendingConfirmation, otpValue);
        const idToken = await user.getIdToken(true);

        loginPartner(phone);
        if (typeof window !== "undefined") {
          const normalizedPhone = phone.replace(/\D/g, "").slice(-10);
          const phoneValue = normalizedPhone.length === 10 ? `+91${normalizedPhone}` : phone;
          window.localStorage.setItem(PARTNER_LOGGED_IN_KEY, "true");
          window.localStorage.setItem(PARTNER_PHONE_KEY, phoneValue);
          window.localStorage.setItem(PARTNER_FIREBASE_UID_KEY, user.uid);
          window.localStorage.setItem(PARTNER_FIREBASE_PHONE_KEY, phoneValue);
          setPartnerStoredFirebaseToken(idToken);
        }

        clearPendingConfirmationResult();
        setAuthMode("firebase");
        const landing = await resolvePartnerLandingRoute();
        router.replace(landing.route);
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
    const landing = await resolvePartnerLandingRoute();
    router.replace(landing.route);
  };

  return (
    <section className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-4 py-10">
      <div className="w-full max-w-[420px] rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
        <div className="mb-4 flex items-center justify-between">
          <Link
            href="/partner/login"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600"
          >
            <ArrowLeft size={16} />
          </Link>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.png" alt="YoPartner" className="h-auto max-h-10 w-auto object-contain" />
          <span className="w-9" />
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-semibold text-slate-900">Verify your number</h1>
          <p className="mt-1 text-sm text-slate-600">Enter the secure 6-digit code sent to your phone.</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">{maskIndianPhoneNumber(phone)}</p>
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
              className="h-12 w-11 rounded-xl border border-slate-300 text-center text-lg font-semibold text-slate-800 outline-none focus:border-[#2563eb]"
            />
          ))}
        </div>

        <p className="mt-3 text-xs text-slate-500">Resend code in 28s</p>

        <button
          type="button"
          onClick={handleVerify}
          disabled={otpValue.length !== 6 || isSubmitting}
          className="mt-5 h-11 w-full rounded-xl bg-[#2563eb] text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isSubmitting ? "Verifying..." : "Verify"}
        </button>
        {error ? <p className="mt-2 text-xs font-medium text-rose-600">{error}</p> : null}
        <p className="mt-2 inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
          {isClientDemoOtpFlow
            ? "Client Demo OTP"
            : mode === "firebase"
              ? "Firebase OTP"
              : IS_PRODUCTION_READY_MODE
                ? "Firebase OTP Required"
                : "Demo OTP"}
        </p>
        {isClientDemoOtpFlow ? (
          <p className="mt-1 text-xs font-medium text-slate-500">Demo login preview</p>
        ) : null}
        {showOtpSessionExpiredHint ? (
          <p className="mt-1 text-xs font-medium text-rose-600">OTP session expired. Please request a new OTP.</p>
        ) : null}

        <p className="mt-4 inline-flex items-center gap-1 text-xs text-slate-500">
          <ShieldCheck size={13} className="text-emerald-600" />
          Secure verification powered by Firebase OTP.
        </p>
      </div>
    </section>
  );
}

