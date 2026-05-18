"use client";

import { CheckCircle2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  clearPartnerStoredFirebaseToken,
  clearPendingConfirmationResult,
  getFirebaseErrorDetails,
  isFirebaseOtpEnabled,
  isFirebaseTestNumbersMode,
  mapFirebaseAuthError,
  sendOtp,
  setAuthMode,
  setupRecaptcha,
} from "@/lib/auth/firebasePhoneAuth";
import { CLIENT_DEMO_PHONE, isClientDemoEnabled, isClientDemoPartnerPhone, setClientDemoPartnerPendingPhone } from "@/lib/clientDemoData";
import { IS_PRODUCTION_READY_MODE } from "@/lib/config/runtime";
import { PARTNER_PHONE_KEY } from "@/lib/partnerAuth";

const PARTNER_SESSION_EXPIRED_MESSAGE =
  "Your login session could not be verified. Please login again as a partner.";

export default function PartnerLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState(() => {
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams(window.location.search);
    if (params.get("reason") !== "session-expired") return "";
    return params.get("message") || PARTNER_SESSION_EXPIRED_MESSAGE;
  });
  const [debugError, setDebugError] = useState<{ code: string; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const firebaseEnabled = isFirebaseOtpEnabled();
  const firebaseTestMode = isFirebaseTestNumbersMode();
  const isDemoPhoneInput = isClientDemoEnabled() && isClientDemoPartnerPhone(phone);
  const showDebugDetails =
    typeof window !== "undefined" &&
    process.env.NODE_ENV !== "production" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

  const handleContinue = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedPhone = phone.replace(/\D/g, "");
    if (!trimmedPhone) {
      setError("Phone number is required.");
      return;
    }
    if (trimmedPhone.length !== 10) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }
    if (!agreed) {
      setError("You must agree to Partner Terms and Safety Guidelines.");
      return;
    }

    const normalizedPhone = `+91${trimmedPhone}`;

    if (typeof window !== "undefined") {
      clearPartnerStoredFirebaseToken();
      clearPendingConfirmationResult();
      window.localStorage.setItem(PARTNER_PHONE_KEY, normalizedPhone);
    }

    if (isClientDemoEnabled() && isClientDemoPartnerPhone(trimmedPhone)) {
      setAuthMode("demo");
      setClientDemoPartnerPendingPhone(normalizedPhone);
      setDebugError(null);
      setError("");
      router.push("/partner/otp");
      return;
    }

    if (IS_PRODUCTION_READY_MODE && !firebaseEnabled) {
      setError("Firebase OTP is not configured. Please check Vercel environment variables.");
      return;
    }

    if (!firebaseEnabled) {
      setAuthMode("demo");
      setDebugError(null);
      router.push("/partner/otp");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setDebugError(null);
    try {
      const verifier = setupRecaptcha("partner-recaptcha-container");
      if (!verifier) {
        setError("Firebase OTP is not ready. Please retry in a moment.");
        setIsSubmitting(false);
        return;
      }
      await sendOtp(normalizedPhone, verifier);
      setAuthMode("firebase");
      router.push("/partner/otp");
    } catch (authError) {
      setError(mapFirebaseAuthError(authError));
      if (showDebugDetails) {
        setDebugError(getFirebaseErrorDetails(authError));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-4 py-10">
      <div className="w-full max-w-[420px] rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
        <div className="mb-6 text-center">
          <Link href="/" className="inline-flex">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo.png" alt="YoPartner" className="h-auto max-h-11 w-auto object-contain" />
          </Link>
          <h1 className="mt-4 text-2xl font-semibold text-slate-900">Welcome to YoPartner</h1>
          <p className="mt-1 text-sm text-slate-600">Sign in securely to continue as a partner.</p>
        </div>

        <form className="space-y-4" onSubmit={handleContinue}>
          <label className="block">
            <p className="mb-1.5 text-sm font-medium text-slate-700">Mobile Number</p>
            <div className="flex h-11 overflow-hidden rounded-xl border border-slate-200 bg-white">
              <span className="inline-flex items-center border-r border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700">
                +91
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value.replace(/[^\d]/g, "").slice(0, 10))}
                placeholder="Enter mobile number"
                className="w-full px-3 text-sm text-slate-800 outline-none"
              />
            </div>
          </label>

          <label className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(event) => setAgreed(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300"
            />
            <span className="text-xs text-slate-700">I agree to YoPartner Partner Terms and Safety Guidelines.</span>
          </label>

          {error ? (
            <p className="inline-flex items-center gap-1 text-sm font-medium text-rose-600">
              <CheckCircle2 size={14} />
              {error}
            </p>
          ) : null}
          {showDebugDetails && debugError ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <p className="font-semibold">Firebase error: {debugError.code}</p>
              <p className="mt-1">Message: {debugError.message}</p>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-11 w-full rounded-xl bg-[#2563eb] text-sm font-semibold text-white transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSubmitting ? "Sending OTP..." : "Continue"}
          </button>

          <p className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
            {firebaseEnabled
              ? firebaseTestMode
                ? "Firebase Test Numbers Mode"
                : "Firebase OTP"
              : IS_PRODUCTION_READY_MODE
                ? "Firebase OTP Required"
                : "Demo OTP"}
          </p>
          <p className="text-xs text-slate-500">Your number is used only for account verification.</p>
          {isDemoPhoneInput ? (
            <p className="inline-flex rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-600">
              Demo OTP enabled • {CLIENT_DEMO_PHONE}
            </p>
          ) : null}
          {firebaseEnabled ? (
            <>
              <p className="text-xs text-slate-500">Complete the verification to receive OTP.</p>
              <div id="partner-recaptcha-container" className="pt-1" />
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
        </form>
      </div>
    </section>
  );
}

