"use client";

import { setDemoLoggedIn } from "@/lib/demoAuth";
import {
  PARTNER_FIREBASE_PHONE_KEY,
  PARTNER_FIREBASE_TOKEN_KEY,
  PARTNER_FIREBASE_UID_KEY,
  USER_FIREBASE_PHONE_KEY,
  USER_FIREBASE_TOKEN_KEY,
  USER_FIREBASE_UID_KEY,
  logoutFirebaseUser,
  setAuthMode,
} from "@/lib/auth/firebasePhoneAuth";
import {
  PARTNER_LOGGED_IN_KEY,
  PARTNER_PHONE_KEY,
  logoutPartner,
} from "@/lib/partnerAuth";

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
  setAuthMode("demo");
  removeKeys([USER_FIREBASE_UID_KEY, USER_FIREBASE_PHONE_KEY, USER_FIREBASE_TOKEN_KEY]);
}

export async function logoutPartnerAuthSession() {
  try {
    await logoutFirebaseUser();
  } catch {
    // Ignore Firebase signout errors and continue local cleanup.
  }

  logoutPartner();
  setAuthMode("demo");
  removeKeys([
    PARTNER_LOGGED_IN_KEY,
    PARTNER_PHONE_KEY,
    PARTNER_FIREBASE_UID_KEY,
    PARTNER_FIREBASE_PHONE_KEY,
    PARTNER_FIREBASE_TOKEN_KEY,
  ]);
}
