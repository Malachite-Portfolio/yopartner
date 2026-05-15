"use client";

import {
  type AuthError,
  type ConfirmationResult,
  RecaptchaVerifier,
  onAuthStateChanged,
  signInWithPhoneNumber,
  signOut,
  type User,
} from "firebase/auth";
import { firebaseAuth, isFirebaseClientConfigured } from "@/lib/firebase/client";

export const USER_FIREBASE_UID_KEY = "yopartner_firebase_uid";
export const USER_FIREBASE_PHONE_KEY = "yopartner_firebase_phone";
export const USER_FIREBASE_TOKEN_KEY = "yopartner_firebase_id_token";

export const PARTNER_FIREBASE_UID_KEY = "yopartner_partner_firebase_uid";
export const PARTNER_FIREBASE_PHONE_KEY = "yopartner_partner_firebase_phone";
export const PARTNER_FIREBASE_TOKEN_KEY = "yopartner_partner_firebase_id_token";

type AuthMode = "firebase" | "demo";
type FirebaseDebugDetails = { code: string; message: string };
type SessionRole = "user" | "partner";

let recaptchaVerifierRef: RecaptchaVerifier | null = null;
let recaptchaWidgetIdRef: number | null = null;
let pendingConfirmationResultRef: ConfirmationResult | null = null;
let activeAuthMode: AuthMode = "demo";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function isFirebaseTestNumbersMode() {
  return process.env.NEXT_PUBLIC_FIREBASE_USE_TEST_NUMBERS === "true";
}

export function setAuthMode(mode: AuthMode) {
  activeAuthMode = mode;
}

export function getAuthMode() {
  return activeAuthMode;
}

export function isFirebaseOtpEnabled() {
  return isFirebaseClientConfigured() && firebaseAuth !== null;
}

export function getPendingConfirmationResult() {
  return pendingConfirmationResultRef;
}

export function getPartnerStoredFirebaseToken() {
  if (!canUseStorage()) return null;
  const token = window.localStorage.getItem(PARTNER_FIREBASE_TOKEN_KEY);
  if (!token || token.trim().length === 0) return null;
  return token.trim();
}

export function setPartnerStoredFirebaseToken(token: string) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(PARTNER_FIREBASE_TOKEN_KEY, token);
}

export function clearPartnerStoredFirebaseToken() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(PARTNER_FIREBASE_TOKEN_KEY);
  window.localStorage.removeItem(PARTNER_FIREBASE_UID_KEY);
}

export async function syncLocalSessionSafely(idToken: string, role: SessionRole) {
  if (typeof window === "undefined") return;

  try {
    const response = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken, role }),
    });

    if (response.ok || process.env.NODE_ENV === "production") return;

    const payload = (await response.json().catch(() => null)) as { error?: string; message?: string } | null;
    const reason = payload?.error || payload?.message || "Unknown error";
    console.warn("[auth] local session sync failed", { role, status: response.status, reason });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.warn("[auth] local session sync request failed", { role, message });
    }
  }
}

export function setPendingConfirmationResult(confirmationResult: ConfirmationResult | null) {
  pendingConfirmationResultRef = confirmationResult;
}

export function clearPendingConfirmationResult() {
  pendingConfirmationResultRef = null;
}

export function resetRecaptcha() {
  if (typeof window !== "undefined" && recaptchaWidgetIdRef !== null) {
    const maybeGreCaptcha = (window as Window & { grecaptcha?: { reset: (widgetId: number) => void } }).grecaptcha;
    try {
      maybeGreCaptcha?.reset(recaptchaWidgetIdRef);
    } catch {
      // Ignore grecaptcha reset errors.
    }
  }

  if (!recaptchaVerifierRef) {
    recaptchaWidgetIdRef = null;
    return;
  }

  try {
    recaptchaVerifierRef.clear();
  } catch {
    // Ignore clear errors and reset references anyway.
  } finally {
    recaptchaVerifierRef = null;
    recaptchaWidgetIdRef = null;
  }
}

export function setupRecaptcha(containerId: string): RecaptchaVerifier | null {
  if (typeof window === "undefined" || !firebaseAuth || !isFirebaseOtpEnabled()) {
    return null;
  }

  // Always recreate a fresh verifier to avoid stale/broken app verifiers.
  resetRecaptcha();

  const container = document.getElementById(containerId);
  if (!container) {
    return null;
  }
  container.innerHTML = "";

  const isTestNumbersMode = isFirebaseTestNumbersMode();
  firebaseAuth.settings.appVerificationDisabledForTesting = isTestNumbersMode;

  const recaptchaSize =
    process.env.NODE_ENV !== "production" ? "normal" : "invisible";

  const verifier = new RecaptchaVerifier(firebaseAuth, containerId, {
    size: recaptchaSize,
  });

  void verifier
    .render()
    .then((widgetId) => {
      recaptchaWidgetIdRef = widgetId;
    })
    .catch(() => {
      resetRecaptcha();
    });

  recaptchaVerifierRef = verifier;
  return recaptchaVerifierRef;
}

export async function sendOtp(phoneNumber: string, recaptchaVerifier: RecaptchaVerifier) {
  if (!firebaseAuth || !isFirebaseOtpEnabled()) {
    throw new Error("Firebase client is not configured.");
  }

  try {
    const confirmationResult = await signInWithPhoneNumber(firebaseAuth, phoneNumber, recaptchaVerifier);
    setPendingConfirmationResult(confirmationResult);
    return confirmationResult;
  } catch (error) {
    const details = getFirebaseErrorDetails(error);
    if (
      details.code === "auth/invalid-app-credential" ||
      details.code === "auth/captcha-check-failed" ||
      details.code === "auth/missing-client-identifier" ||
      details.code === "auth/internal-error" ||
      details.message.toLowerCase().includes("recaptcha")
    ) {
      resetRecaptcha();
    }
    throw error;
  }
}

export async function verifyOtp(confirmationResult: ConfirmationResult, otp: string) {
  const credential = await confirmationResult.confirm(otp);
  return credential.user;
}

export function getCurrentFirebaseUser(): User | null {
  if (!firebaseAuth) return null;
  return firebaseAuth.currentUser;
}

export async function logoutFirebaseUser() {
  if (!firebaseAuth) return;
  await signOut(firebaseAuth);
  clearPendingConfirmationResult();
}

export async function getFirebaseIdToken(forceRefresh = false) {
  const user = getCurrentFirebaseUser();
  if (!user) return null;
  return user.getIdToken(forceRefresh);
}

export function subscribeFirebaseAuthState(callback: (user: User | null) => void) {
  if (!firebaseAuth) {
    callback(null);
    return () => undefined;
  }

  return onAuthStateChanged(firebaseAuth, callback);
}

export function mapFirebaseAuthError(error: unknown) {
  const defaultMessage = "Unable to continue. Please try again.";
  const { code, message } = getFirebaseErrorDetails(error);
  if (!code) return defaultMessage;

  const map: Record<string, string> = {
    "auth/invalid-phone-number": "Please enter a valid 10-digit phone number.",
    "auth/too-many-requests": "Too many attempts. Please wait and try again.",
    "auth/quota-exceeded": "OTP quota exceeded for this project. Please try later.",
    "auth/captcha-check-failed": "reCAPTCHA verification failed. Please retry.",
    "auth/code-expired": "OTP expired. Request a new OTP and try again.",
    "auth/invalid-verification-code": "Invalid OTP. Please check and try again.",
    "auth/missing-client-identifier": "Missing client identifier. Refresh and try again.",
    "auth/network-request-failed": "Network error. Please check your connection and retry.",
    "auth/internal-error": "Temporary authentication issue. Please retry.",
    "auth/invalid-app-credential":
      "Firebase app verification failed. Check: Phone provider enabled, localhost authorized, test phone number added, reCAPTCHA container rendered, browser extensions disabled, and try Incognito.",
  };

  if (message.toLowerCase().includes("recaptcha")) {
    return "reCAPTCHA verification failed. Please retry.";
  }

  return map[code] ?? defaultMessage;
}

export function getFirebaseErrorDetails(error: unknown): FirebaseDebugDetails {
  const fallback: FirebaseDebugDetails = {
    code: "unknown",
    message: "No additional details available.",
  };

  if (!error || typeof error !== "object") return fallback;

  const authError = error as Partial<AuthError> & { message?: string };
  return {
    code: authError.code ?? "unknown",
    message: authError.message ?? "No additional details available.",
  };
}
