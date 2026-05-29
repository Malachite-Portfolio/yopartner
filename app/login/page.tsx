"use client";

import { BadgeCheck, Lock, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  getFirebaseErrorDetails,
  isFirebaseOtpEnabled,
  isFirebaseTestNumbersMode,
  mapFirebaseAuthError,
  sendOtp,
  setAuthMode,
  setupRecaptcha,
} from "@/lib/auth/firebasePhoneAuth";
import {
  OTP_RESEND_AVAILABLE_AT_KEY,
  resolvePostAuthDestination,
  sanitizeReturnUrl,
  setPendingUserPhone,
  setStoredPostLoginRedirect,
} from "@/lib/auth/onboarding";
import { IS_PRODUCTION_READY_MODE } from "@/lib/config/runtime";
import { restoreUserAuthSessionFromFirebase } from "@/lib/auth/userAuth";

const OTP_RESEND_SECONDS = 28;

function getReturnUrlFromLocation() {
  if (typeof window === "undefined") return null;
  return sanitizeReturnUrl(new URLSearchParams(window.location.search).get("returnUrl"));
}

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

  useEffect(() => {
    let active = true;
    void (async () => {
      const restored = await restoreUserAuthSessionFromFirebase(false);
      if (!active || !restored.loggedIn) return;

      const safeReturnUrl = getReturnUrlFromLocation();
      if (safeReturnUrl) {
        setStoredPostLoginRedirect(safeReturnUrl);
      }

      const destination = await resolvePostAuthDestination("/connect-now");
      router.replace(destination.destination);
    })();

    return () => {
      active = false;
    };
  }, [router]);

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
    setPendingUserPhone(normalized);
    setStoredPostLoginRedirect(getReturnUrlFromLocation());

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
      if (typeof window !== "undefined") {
        const nextResendAt = Date.now() + OTP_RESEND_SECONDS * 1000;
        window.localStorage.setItem(OTP_RESEND_AVAILABLE_AT_KEY, String(nextResendAt));
      }
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
    <section className="flex min-h-screen items-center justify-center bg-[#f4fbf7] px-4 py-10">
      <div className="w-full max-w-[460px] rounded-3xl border border-[#dceee6] bg-[#fffefb] p-6 shadow-[0_20px_65px_-40px_rgba(0,0,0,0.35)] sm:p-8">
        <div className="text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.png" alt="YoPartner" className="mx-auto h-auto max-h-11 w-auto object-contain" />
          <div className="mt-5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#267f71]">
            <span className="rounded-full bg-[#d9f2ea] px-2 py-1">Step 1</span>
            <div className="h-1 flex-1 rounded-full bg-[#e4f4ee]">
              <div className="h-1 w-1/3 rounded-full bg-[#1d8a76]" />
            </div>
            <span>3</span>
          </div>
          <h1 className="mt-4 text-3xl font-semibold text-[#16382f]">Welcome to YoPartner</h1>
          <p className="mt-2 text-sm text-[#5b7269]">Enter your number to receive a secure verification code.</p>
        </div>

        <div className="mt-7 space-y-4">
          <label className="block">
            <p className="mb-1.5 text-sm font-medium text-[#305247]">Phone Number</p>
            <div className="flex h-12 overflow-hidden rounded-2xl border border-[#d2e7de] bg-[#f8fcfa]">
              <span className="inline-flex items-center border-r border-[#d2e7de] bg-[#eef8f4] px-3 text-sm font-semibold text-[#2d6758]">
                +91
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value.replace(/[^0-9]/g, "").slice(0, 10))}
                placeholder="Enter mobile number"
                className="w-full bg-transparent px-3 text-sm text-slate-800 outline-none placeholder:text-slate-400"
              />
            </div>
          </label>

          <label className="flex items-start gap-2 rounded-2xl border border-[#d8ebe3] bg-[#f4faf7] px-3 py-3">
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
            <span className="text-xs text-[#46665b]">
              I agree to the Terms of Use and Privacy Policy for secure account access.
            </span>
          </label>

          <button
            type="button"
            onClick={handleContinue}
            disabled={isSubmitting}
            className="h-12 w-full rounded-2xl bg-[#127e6d] text-sm font-semibold text-white transition hover:bg-[#0f6e5f] disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSubmitting ? "Sending Verification Code..." : "Send Verification Code"}
          </button>

          <p className="text-xs text-[#587568]">We only use your number for OTP authentication and account security.</p>

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
              <p className="text-xs text-[#587568]">Complete verification to receive OTP.</p>
              <div id="user-recaptcha-container" className="pt-1" />
            </>
          ) : null}

          {!firebaseEnabled && IS_PRODUCTION_READY_MODE ? (
            <p className="text-xs font-medium text-rose-600">
              Firebase OTP is not configured. Please check Vercel environment variables.
            </p>
          ) : null}

          <div className="grid grid-cols-3 gap-2 rounded-2xl border border-[#d8ebe3] bg-[#f7fcfa] p-3 text-[11px] font-medium text-[#3d5e53]">
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

          <div className="flex items-center justify-center gap-4 pt-1 text-xs text-[#4b6a5f]">
            <Link href="/privacy" className="hover:text-[#127e6d]">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-[#127e6d]">Terms of Use</Link>
            <Link href="/support" className="hover:text-[#127e6d]">Help Center</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
