"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  clearPendingConfirmationResult,
  getPendingConfirmationResult,
  isFirebaseOtpEnabled,
  mapFirebaseAuthError,
  sendOtp,
  setAuthMode,
  setupRecaptcha,
  verifyOtp,
} from "@/lib/auth/firebasePhoneAuth";
import {
  clearAdminAuthSession,
  setAdminAuthSession,
  verifyAdminRole,
} from "@/lib/adminAuth";
import {
  activateClientDemoAdminSession,
  CLIENT_DEMO_ADMIN_PIN,
  isClientDemoEnabled,
} from "@/lib/clientDemoData";

export default function AdminLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const otpValue = useMemo(() => otpDigits.join(""), [otpDigits]);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const firebaseEnabled = isFirebaseOtpEnabled();

  const handleDemoLogin = () => {
    if (!isClientDemoEnabled()) return;
    if (pin.trim() !== CLIENT_DEMO_ADMIN_PIN) {
      setError("Invalid demo PIN.");
      return;
    }
    setError("");
    activateClientDemoAdminSession();
    router.replace("/admin");
  };

  const handleSendOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedPhone = phone.replace(/\D/g, "");
    if (trimmedPhone.length !== 10) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }
    if (!firebaseEnabled) {
      setError("Firebase OTP is not configured. Please check environment variables.");
      return;
    }

    const normalizedPhone = `+91${trimmedPhone}`;
    setError("");
    setIsSubmitting(true);
    clearAdminAuthSession();
    clearPendingConfirmationResult();

    try {
      const verifier = setupRecaptcha("admin-recaptcha-container");
      if (!verifier) {
        setError("Firebase OTP is not ready. Please retry in a moment.");
        return;
      }
      await sendOtp(normalizedPhone, verifier);
      setAuthMode("firebase");
      setStep("otp");
    } catch (authError) {
      setError(mapFirebaseAuthError(authError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateDigit = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    setError("");
    setOtpDigits((current) => current.map((digit, i) => (i === index ? value : digit)));
    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const pendingConfirmation = getPendingConfirmationResult();
    if (!pendingConfirmation) {
      setError("OTP session expired. Please request a new OTP.");
      return;
    }
    if (otpValue.length !== 6) {
      setError("Please enter the complete 6-digit OTP.");
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      const user = await verifyOtp(pendingConfirmation, otpValue);
      const idToken = await user.getIdToken(true);
      const trimmedPhone = phone.replace(/\D/g, "");
      const normalizedPhone = `+91${trimmedPhone}`;

      setAdminAuthSession({
        idToken,
        uid: user.uid,
        phone: normalizedPhone,
      });

      clearPendingConfirmationResult();
      setAuthMode("firebase");

      const roleCheck = await verifyAdminRole();
      if (roleCheck.role !== "ADMIN") {
        clearAdminAuthSession();
        setError(
          roleCheck.status === 403
            ? "You do not have permission to access the admin panel."
            : roleCheck.message ?? "Unable to verify admin access. Please try again.",
        );
        return;
      }

      router.replace("/admin");
    } catch (verifyError) {
      clearAdminAuthSession();
      setError(mapFirebaseAuthError(verifyError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
        <div className="mb-6 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.png" alt="YoPartner" className="mx-auto h-auto max-h-12 w-auto object-contain" />
          <h1 className="mt-4 text-2xl font-semibold text-slate-900">Admin Login</h1>
          <p className="mt-1 text-sm text-slate-600">
            {step === "phone" ? "Verify your admin phone number with OTP." : "Enter the 6-digit OTP to continue."}
          </p>
        </div>

        {step === "phone" ? (
          <form className="space-y-4" onSubmit={handleSendOtp}>
            <label className="block">
              <p className="mb-1.5 text-sm font-medium text-slate-700">Admin Mobile Number</p>
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

            {isClientDemoEnabled() ? (
              <label className="block">
                <p className="mb-1.5 text-sm font-medium text-slate-700">Client Demo PIN</p>
                <input
                  type="password"
                  value={pin}
                  onChange={(event) => setPin(event.target.value.replace(/[^\d]/g, "").slice(0, 4))}
                  placeholder="Enter 4-digit PIN"
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-800 outline-none transition focus:border-[#2563eb]"
                />
              </label>
            ) : null}

            {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="h-11 w-full rounded-xl bg-[#2563eb] text-sm font-semibold text-white transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isSubmitting ? "Sending OTP..." : "Send OTP"}
            </button>

            {isClientDemoEnabled() ? (
              <button
                type="button"
                onClick={handleDemoLogin}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Login with Demo PIN
              </button>
            ) : null}

            <p className="text-xs text-slate-500">Complete reCAPTCHA verification to receive OTP.</p>
            {firebaseEnabled ? <div id="admin-recaptcha-container" className="pt-1" /> : null}
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              <span>Sent to +91{phone.replace(/\D/g, "")}</span>
              <button
                type="button"
                onClick={() => {
                  setStep("phone");
                  setOtpDigits(["", "", "", "", "", ""]);
                  setError("");
                }}
                className="font-semibold text-[#2563eb]"
              >
                Change
              </button>
            </div>

            <div className="flex items-center justify-center gap-2">
              {otpDigits.map((digit, index) => (
                <input
                  key={index}
                  ref={(element) => {
                    inputsRef.current[index] = element;
                  }}
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(event) => updateDigit(index, event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Backspace" && !otpDigits[index] && index > 0) {
                      inputsRef.current[index - 1]?.focus();
                    }
                  }}
                  className="h-12 w-11 rounded-xl border border-slate-300 text-center text-lg font-semibold text-slate-800 outline-none focus:border-[#2563eb]"
                />
              ))}
            </div>

            {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={isSubmitting || otpValue.length !== 6}
              className="h-11 w-full rounded-xl bg-[#2563eb] text-sm font-semibold text-white transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isSubmitting ? "Verifying..." : "Verify OTP"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
