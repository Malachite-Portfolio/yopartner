"use client";

import { ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  getFirebaseErrorDetails,
  isFirebaseOtpEnabled,
  isFirebaseTestNumbersMode,
  mapFirebaseAuthError,
  sendOtp,
  setAuthMode,
  setupRecaptcha,
} from "@/lib/auth/firebasePhoneAuth";
import { IS_PRODUCTION_READY_MODE } from "@/lib/config/runtime";
import { setDemoPhone } from "@/lib/demoAuth";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [message, setMessage] = useState("");
  const [debugError, setDebugError] = useState<{ code: string; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const firebaseEnabled = isFirebaseOtpEnabled();
  const firebaseTestMode = isFirebaseTestNumbersMode();
  const showDebugDetails =
    typeof window !== "undefined" &&
    process.env.NODE_ENV !== "production" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

  const handleContinue = async () => {
    const digits = phone.replace(/\D/g, "");
    if (!digits) {
      setMessage("Phone number is required.");
      return;
    }
    if (digits.length !== 10) {
      setMessage("Enter a valid 10-digit mobile number.");
      return;
    }
    if (!accepted) {
      setMessage("Please accept Terms & Conditions and Privacy Policy.");
      return;
    }

    const normalized = `+91${digits}`;
    setDemoPhone(normalized);

    if (IS_PRODUCTION_READY_MODE && !firebaseEnabled) {
      setMessage("Firebase OTP is not configured. Please check Vercel environment variables.");
      return;
    }

    if (!firebaseEnabled) {
      setAuthMode("demo");
      setMessage("");
      setDebugError(null);
      router.push("/otp");
      return;
    }

    setIsSubmitting(true);
    setMessage("");
    setDebugError(null);
    try {
      const verifier = setupRecaptcha("user-recaptcha-container");
      if (!verifier) {
        setMessage("Firebase OTP is not ready. Please retry in a moment.");
        setIsSubmitting(false);
        return;
      }

      await sendOtp(normalized, verifier);
      setAuthMode("firebase");
      router.push("/otp");
    } catch (error) {
      setMessage(mapFirebaseAuthError(error));
      if (showDebugDetails) {
        setDebugError(getFirebaseErrorDetails(error));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-4 py-10">
      <div className="w-full max-w-[420px] rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
        <div className="text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.png" alt="YoPartner" className="mx-auto h-auto max-h-11 w-auto object-contain" />
          <h1 className="mt-4 text-2xl font-semibold text-slate-900">Sign in to YoPartner</h1>
          <p className="mt-1 text-sm text-slate-600">Enter your phone number to continue securely.</p>
        </div>

        <div className="mt-6 space-y-4">
          <label className="block">
            <p className="mb-1.5 text-sm font-medium text-slate-700">Phone Number</p>
            <div className="flex h-11 overflow-hidden rounded-xl border border-slate-200 bg-white">
              <span className="inline-flex items-center border-r border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700">
                +91
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value.replace(/[^0-9]/g, "").slice(0, 10))}
                placeholder="Enter mobile number"
                className="w-full px-3 text-sm text-slate-800 outline-none"
              />
            </div>
          </label>

          <label className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(event) => {
                setAccepted(event.target.checked);
                if (event.target.checked) {
                  setMessage("");
                }
              }}
              className="mt-0.5"
            />
            <span className="text-xs text-slate-700">I accept the Terms &amp; Conditions and Privacy Policy.</span>
          </label>

          <button
            type="button"
            onClick={handleContinue}
            disabled={isSubmitting}
            className="h-11 w-full rounded-xl bg-[#2563eb] text-sm font-semibold text-white transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSubmitting ? "Sending OTP..." : "Continue"}
          </button>

          <p className="text-xs text-slate-500">We&apos;ll send a one-time password to verify your number.</p>

          {message ? <p className="text-xs font-medium text-rose-600">{message}</p> : null}
          {showDebugDetails && debugError ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <p className="font-semibold">Firebase error: {debugError.code}</p>
              <p className="mt-1">Message: {debugError.message}</p>
            </div>
          ) : null}

          <p className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
            {firebaseEnabled
              ? firebaseTestMode
                ? "Firebase Test Numbers Mode"
                : "Firebase OTP"
              : IS_PRODUCTION_READY_MODE
                ? "Firebase OTP Required"
                : "Demo OTP"}
          </p>

          {firebaseEnabled ? (
            <>
              <p className="text-xs text-slate-500">Complete the verification to receive OTP.</p>
              <div id="user-recaptcha-container" className="pt-1" />
            </>
          ) : null}

          {!firebaseEnabled && IS_PRODUCTION_READY_MODE ? (
            <p className="text-xs font-medium text-rose-600">
              Firebase OTP is not configured. Please check Vercel environment variables.
            </p>
          ) : null}

          <p className="inline-flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck size={14} className="text-emerald-600" />
            Secure login powered by Firebase OTP.
          </p>
        </div>
      </div>
    </section>
  );
}

