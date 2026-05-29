"use client";

import { getCurrentUserProfile } from "@/lib/api/users";

export const POST_LOGIN_REDIRECT_KEY = "yopartner_post_login_redirect";
export const PENDING_USER_PHONE_KEY = "yopartner_pending_user_phone";
export const OTP_RESEND_AVAILABLE_AT_KEY = "yopartner_otp_resend_available_at";

export function sanitizeReturnUrl(value: string | null | undefined) {
  if (!value) return null;
  return value.startsWith("/") ? value : null;
}

export function getStoredPostLoginRedirect() {
  if (typeof window === "undefined") return null;
  return sanitizeReturnUrl(window.localStorage.getItem(POST_LOGIN_REDIRECT_KEY));
}

export function setStoredPostLoginRedirect(value: string | null | undefined) {
  if (typeof window === "undefined") return;
  const safeValue = sanitizeReturnUrl(value);
  if (!safeValue) {
    window.localStorage.removeItem(POST_LOGIN_REDIRECT_KEY);
    return;
  }
  window.localStorage.setItem(POST_LOGIN_REDIRECT_KEY, safeValue);
}

export function consumeStoredPostLoginRedirect() {
  const redirect = getStoredPostLoginRedirect();
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(POST_LOGIN_REDIRECT_KEY);
  }
  return redirect;
}

export function getPendingUserPhone() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(PENDING_USER_PHONE_KEY) ?? "";
}

export function setPendingUserPhone(phone: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PENDING_USER_PHONE_KEY, phone);
}

export function clearPendingUserPhone() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PENDING_USER_PHONE_KEY);
}

export async function resolvePostAuthDestination(fallback = "/connect-now") {
  const profileResult = await getCurrentUserProfile();
  if (profileResult.error) {
    return { destination: consumeStoredPostLoginRedirect() || fallback, profileComplete: true };
  }

  if (!profileResult.data?.profileComplete) {
    return { destination: "/onboarding/profile", profileComplete: false };
  }

  return {
    destination: consumeStoredPostLoginRedirect() || fallback,
    profileComplete: true,
  };
}
