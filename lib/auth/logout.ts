"use client";

import { setDemoLoggedIn } from "@/lib/demoAuth";
import { IS_DEMO_MODE } from "@/lib/config/runtime";
import { clearClientDemoPartnerSession } from "@/lib/clientDemoData";
import {
  PARTNER_FIREBASE_PHONE_KEY,
  PARTNER_FIREBASE_TOKEN_KEY,
  PARTNER_FIREBASE_UID_KEY,
  logoutFirebaseUser,
  setAuthMode,
} from "@/lib/auth/firebasePhoneAuth";
import { clearUserAuthSession } from "@/lib/auth/userAuth";
import {
  PARTNER_LOGGED_IN_KEY,
  PARTNER_PHONE_KEY,
  logoutPartner,
} from "@/lib/partnerAuth";

const POST_LOGIN_REDIRECT_KEY = "yopartner_post_login_redirect";
const PENDING_USER_PHONE_KEY = "yopartner_pending_user_phone";
const OTP_RESEND_AVAILABLE_AT_KEY = "yopartner_otp_resend_available_at";

function removeKeys(keys: string[]) {
  if (typeof window === "undefined") return;
  keys.forEach((key) => window.localStorage.removeItem(key));
}

export async function logoutUserAuthSession() {
  try {
    await logoutFirebaseUser();
  } catch {
    // Ignore Firebase signout errors and continue local cleanup.
  }

  setDemoLoggedIn(false);
  if (IS_DEMO_MODE) {
    setAuthMode("demo");
  }
  clearUserAuthSession();
  removeKeys([
    POST_LOGIN_REDIRECT_KEY,
    PENDING_USER_PHONE_KEY,
    OTP_RESEND_AVAILABLE_AT_KEY,
  ]);
}

export async function logoutPartnerAuthSession() {
  try {
    await logoutFirebaseUser();
  } catch {
    // Ignore Firebase signout errors and continue local cleanup.
  }

  logoutPartner();
  if (IS_DEMO_MODE) {
    setAuthMode("demo");
  }
  clearClientDemoPartnerSession();
  removeKeys([
    PARTNER_LOGGED_IN_KEY,
    PARTNER_PHONE_KEY,
    PARTNER_FIREBASE_UID_KEY,
    PARTNER_FIREBASE_PHONE_KEY,
    PARTNER_FIREBASE_TOKEN_KEY,
  ]);
}
