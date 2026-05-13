"use client";

import { CheckCircle2, ShieldCheck, Sparkles, Users, WalletCards } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { PARTNER_PHONE_KEY } from "@/lib/partnerAuth";

const features = [
  { title: "Flexible work", icon: WalletCards },
  { title: "Safe platform", icon: ShieldCheck },
  { title: "Verified community", icon: Users },
  { title: "Meaningful conversations", icon: Sparkles },
];

export default function PartnerLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [debugError, setDebugError] = useState<{ code: string; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const firebaseEnabled = isFirebaseOtpEnabled();
  const firebaseTestMode = isFirebaseTestNumbersMode();
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
      window.localStorage.setItem(PARTNER_PHONE_KEY, normalizedPhone);
    }

    if (IS_PRODUCTION_READY_MODE && !firebaseEnabled) {
      setError("Authentication is not configured. Please contact support.");
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
    <section className="grid min-h-screen bg-slate-50 lg:grid-cols-2">
      <div className="hidden bg-gradient-to-br from-[#0f1f4d] via-[#1d4ed8] to-[#0ea5a6] p-10 text-white lg:block">
        <div className="mx-auto flex h-full max-w-lg flex-col">
          <Link href="/" className="inline-flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo.png" alt="YoPartner" className="h-auto max-h-14 w-auto object-contain" />
          </Link>

          <div className="mt-12">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/90">
              YoPartner Companion
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight">
              Become a YoPartner Companion
            </h1>
            <p className="mt-4 text-base text-cyan-50/95">
              Help people feel heard, supported, and less alone through safe, respectful companionship.
            </p>
          </div>

          <div className="mt-10 grid gap-3">
            {features.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="flex items-center gap-3 rounded-xl border border-white/20 bg-white/10 px-4 py-3"
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
                    <Icon size={16} />
                  </span>
                  <p className="text-sm font-medium text-white">{item.title}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
          <div className="mb-6 text-center lg:text-left">
            <div className="mb-3 inline-flex lg:hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/logo.png" alt="YoPartner" className="h-auto max-h-12 w-auto object-contain" />
            </div>
            <h2 className="text-2xl font-semibold text-slate-900">Partner Login</h2>
            <p className="mt-1 text-sm text-slate-600">Enter your mobile number to continue.</p>
          </div>

          <form className="space-y-4" onSubmit={handleContinue}>
            <label className="block">
              <p className="mb-1.5 text-sm font-medium text-slate-700">Mobile Number</p>
              <div className="flex h-11 overflow-hidden rounded-xl border border-slate-200">
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
              <span className="text-xs text-slate-700">
                I agree to YoPartner Partner Terms and Safety Guidelines.
              </span>
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
              className="h-11 w-full rounded-xl bg-gradient-to-r from-[#1d4ed8] to-[#0ea5a6] text-sm font-semibold text-white"
            >
              {isSubmitting ? "Sending OTP..." : "Continue"}
            </button>
            <p className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
              {firebaseEnabled
                ? firebaseTestMode
                  ? "Firebase Test Numbers Mode"
                  : "Firebase OTP"
                : IS_PRODUCTION_READY_MODE
                  ? "OTP Unavailable"
                  : "Demo OTP"}
            </p>
            {firebaseEnabled ? (
              <>
                <p className="text-xs text-slate-500">Complete the verification to receive OTP.</p>
                <div id="partner-recaptcha-container" className="mt-2" />
              </>
            ) : null}
            {!firebaseEnabled && IS_PRODUCTION_READY_MODE ? (
              <p className="text-xs font-medium text-rose-600">
                Authentication is not configured. Please contact support.
              </p>
            ) : null}
          </form>
        </div>
      </div>
    </section>
  );
}
