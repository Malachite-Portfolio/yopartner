"use client";

import { ShieldCheck, Sparkles } from "lucide-react";
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
import { connectCompanions } from "@/lib/data";
import { setDemoPhone } from "@/lib/demoAuth";

const previewCompanions = connectCompanions.slice(0, 3);

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
      setMessage("Authentication is not configured. Please contact support.");
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
    <div className="min-h-screen bg-white lg:grid lg:grid-cols-2">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#2563EB] via-[#9B5DE5] to-[#f97316] p-7 text-white sm:p-10">
        <div className="relative z-10">
          <h1 className="text-4xl font-semibold sm:text-5xl">Welcome to YoPartner</h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-white/90 sm:text-base">
            Continue your journey with our trusted companionship platform. Your security and privacy are our top priorities.
          </p>

          <div className="mt-10 rounded-3xl border border-white/25 bg-white/10 p-8 backdrop-blur-sm">
            <p className="text-7xl">💬</p>
            <p className="mt-4 text-3xl font-semibold">Secure Authentication</p>
            <p className="mt-2 max-w-lg text-sm text-white/90">
              Continue your journey with our trusted companion services platform. Your security and privacy are our top priorities.
            </p>
          </div>
        </div>

        <div className="pointer-events-none absolute -bottom-20 -right-16 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
      </section>

      <section className="flex items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-[560px]">
          <p className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
            <Sparkles size={14} className="text-[#7c3aed]" />
            India&apos;s trusted Human Connection Platform
          </p>

          <h2 className="mt-5 text-3xl font-semibold text-slate-900">Someone who actually listens to you</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
            Chat or call a real, verified companion for loneliness, stress, heartbreak, or just a good conversation.
          </p>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-[#101828] px-4 py-3 text-white">
            <p className="font-semibold">Your first chat is completely free</p>
            <p className="mt-1 text-xs text-white/80">No credit card · No commitment</p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {previewCompanions.map((companion) => (
              <article key={companion.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={companion.image} alt={companion.name} className="h-20 w-full rounded-lg object-cover" />
                <p className="mt-2 text-sm font-semibold text-slate-900">{companion.name}</p>
                <p className="truncate text-xs text-slate-500">{companion.tagline}</p>
                <p className="mt-1 text-xs font-semibold text-amber-500">★★★★★ {companion.rating.toFixed(1)}</p>
              </article>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 p-4">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Phone Number</label>
            <div className="mt-2 flex items-center rounded-xl border border-slate-300 bg-white px-3">
              <span className="mr-2 text-sm">🇮🇳</span>
              <span className="mr-2 text-sm font-semibold text-slate-700">+91</span>
              <input
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value.replace(/[^0-9]/g, "").slice(0, 10))}
                placeholder="Enter phone number"
                className="h-12 w-full bg-transparent text-sm outline-none"
              />
            </div>

            <label className="mt-4 flex items-start gap-2 text-xs text-slate-600">
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
              I accept the Terms &amp; Conditions and Privacy Policy.
            </label>

            <button
              type="button"
              onClick={handleContinue}
              disabled={isSubmitting}
              className="mt-4 w-full rounded-full bg-gradient-to-r from-[#f97316] to-[#ea580c] px-6 py-3 text-sm font-semibold text-white"
            >
              {isSubmitting ? "Sending OTP..." : "Talk Now"}
            </button>

            {message && <p className="mt-2 text-xs font-medium text-red-600">{message}</p>}
            {showDebugDetails && debugError ? (
              <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <p className="font-semibold">Firebase error: {debugError.code}</p>
                <p className="mt-1">Message: {debugError.message}</p>
              </div>
            ) : null}
            <p className="mt-2 inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
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
                <p className="mt-2 text-xs text-slate-500">Complete the verification to receive OTP.</p>
                <div id="user-recaptcha-container" className="mt-2" />
              </>
            ) : null}
            {!firebaseEnabled && IS_PRODUCTION_READY_MODE ? (
              <p className="mt-2 text-xs font-medium text-rose-600">
                Authentication is not configured. Please contact support.
              </p>
            ) : null}

            <p className="mt-4 inline-flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck size={14} className="text-emerald-600" />
              Your number is encrypted and only used to verify you
            </p>
            <p className="mt-1 text-xs text-slate-500">Verified companions · 100% private &amp; safe</p>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-[#111827] px-4 py-3 text-white">
            <p className="font-semibold">You deserve to be heard</p>
            <p className="mt-1 text-xs text-white/80">
              Join 50,000+ people who found comfort, connection, and compassion on YoPartner.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
