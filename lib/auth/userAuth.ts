"use client";

import { getCurrentFirebaseUser, subscribeFirebaseAuthState } from "@/lib/auth/firebasePhoneAuth";

export const USER_AUTH_CHANGED_EVENT = "yopartner:user-auth-changed";
export const USER_LOGGED_IN_KEY = "yopartner_user_logged_in";
export const USER_UID_KEY = "yopartner_user_firebase_uid";
export const USER_PHONE_KEY = "yopartner_user_phone";
export const USER_TOKEN_KEY = "yopartner_user_firebase_id_token";

const LEGACY_USER_UID_KEY = "yopartner_firebase_uid";
const LEGACY_USER_PHONE_KEY = "yopartner_firebase_phone";
const LEGACY_USER_TOKEN_KEY = "yopartner_firebase_id_token";

type NullableString = string | null;

export type UserAuthState = {
  loggedIn: boolean;
  uid: NullableString;
  phone: NullableString;
  token: NullableString;
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function normalizeString(value: NullableString | undefined) {
  if (!value) return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function readFirst(...keys: string[]) {
  if (!canUseStorage()) return null;
  for (const key of keys) {
    const value = normalizeString(window.localStorage.getItem(key));
    if (value) return value;
  }
  return null;
}

function dispatchUserAuthChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(USER_AUTH_CHANGED_EVENT));
}

function migrateLegacyUserKeys() {
  if (!canUseStorage()) return;
  const uid = normalizeString(window.localStorage.getItem(LEGACY_USER_UID_KEY));
  const phone = normalizeString(window.localStorage.getItem(LEGACY_USER_PHONE_KEY));
  const token = normalizeString(window.localStorage.getItem(LEGACY_USER_TOKEN_KEY));
  const hasLegacy = Boolean(uid || phone || token);
  if (!hasLegacy) return;

  if (uid) window.localStorage.setItem(USER_UID_KEY, uid);
  if (phone) window.localStorage.setItem(USER_PHONE_KEY, phone);
  if (token) window.localStorage.setItem(USER_TOKEN_KEY, token);
  window.localStorage.setItem(USER_LOGGED_IN_KEY, token || uid ? "true" : "false");
}

export function getUserAuthState(): UserAuthState {
  if (!canUseStorage()) {
    return { loggedIn: false, uid: null, phone: null, token: null };
  }
  migrateLegacyUserKeys();
  const uid = readFirst(USER_UID_KEY, LEGACY_USER_UID_KEY);
  const phone = readFirst(USER_PHONE_KEY, LEGACY_USER_PHONE_KEY);
  const token = readFirst(USER_TOKEN_KEY, LEGACY_USER_TOKEN_KEY);
  const explicit = window.localStorage.getItem(USER_LOGGED_IN_KEY) === "true";
  const loggedIn = Boolean(token || uid || explicit);
  return { loggedIn, uid, phone, token };
}

export function saveUserAuthSession(input: { token?: string | null; uid?: string | null; phone?: string | null }) {
  if (!canUseStorage()) return;
  const previous = getUserAuthState();
  const nextToken = normalizeString(input.token ?? previous.token);
  const nextUid = normalizeString(input.uid ?? previous.uid);
  const nextPhone = normalizeString(input.phone ?? previous.phone);

  if (nextToken) window.localStorage.setItem(USER_TOKEN_KEY, nextToken);
  else window.localStorage.removeItem(USER_TOKEN_KEY);
  if (nextUid) window.localStorage.setItem(USER_UID_KEY, nextUid);
  else window.localStorage.removeItem(USER_UID_KEY);
  if (nextPhone) window.localStorage.setItem(USER_PHONE_KEY, nextPhone);
  else window.localStorage.removeItem(USER_PHONE_KEY);
  window.localStorage.setItem(USER_LOGGED_IN_KEY, nextToken || nextUid ? "true" : "false");
  dispatchUserAuthChanged();
}

export function clearUserAuthSession() {
  if (!canUseStorage()) return;
  [
    USER_LOGGED_IN_KEY,
    USER_UID_KEY,
    USER_PHONE_KEY,
    USER_TOKEN_KEY,
    LEGACY_USER_UID_KEY,
    LEGACY_USER_PHONE_KEY,
    LEGACY_USER_TOKEN_KEY,
  ].forEach((key) => window.localStorage.removeItem(key));
  dispatchUserAuthChanged();
}

async function waitForFirebaseUser(timeoutMs = 1800) {
  const existing = getCurrentFirebaseUser();
  if (existing) return existing;
  if (typeof window === "undefined") return null;

  return new Promise<ReturnType<typeof getCurrentFirebaseUser>>((resolve) => {
    let settled = false;
    const done = (value: ReturnType<typeof getCurrentFirebaseUser>) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      unsubscribe();
      resolve(value);
    };
    const unsubscribe = subscribeFirebaseAuthState((user) => {
      done(user);
    });
    const timer = window.setTimeout(() => {
      done(getCurrentFirebaseUser());
    }, timeoutMs);
  });
}

export async function restoreUserAuthSessionFromFirebase(forceRefresh = false) {
  const user = (await waitForFirebaseUser()) ?? getCurrentFirebaseUser();
  if (!user) return getUserAuthState();

  try {
    const token = await user.getIdToken(forceRefresh);
    saveUserAuthSession({
      uid: user.uid,
      phone: user.phoneNumber ?? undefined,
      token,
    });
  } catch {
    // Leave stored keys untouched. API client handles true expiry/invalidation.
  }
  return getUserAuthState();
}

export async function getUserAuthTokenWithRestore() {
  const current = getUserAuthState();
  if (current.token) return current.token;
  const restored = await restoreUserAuthSessionFromFirebase(false);
  return restored.token;
}

export function subscribeUserAuthState(callback: (state: UserAuthState) => void) {
  if (typeof window === "undefined") {
    callback({ loggedIn: false, uid: null, phone: null, token: null });
    return () => undefined;
  }

  const emit = () => callback(getUserAuthState());
  emit();

  const onStorage = (event: Event) => {
    if (event instanceof StorageEvent && event.key) {
      const trackedKeys = new Set([
        USER_LOGGED_IN_KEY,
        USER_UID_KEY,
        USER_PHONE_KEY,
        USER_TOKEN_KEY,
        LEGACY_USER_UID_KEY,
        LEGACY_USER_PHONE_KEY,
        LEGACY_USER_TOKEN_KEY,
      ]);
      if (!trackedKeys.has(event.key)) return;
    }
    emit();
  };

  const unsubscribeFirebase = subscribeFirebaseAuthState((user) => {
    if (user) {
      void user
        .getIdToken(false)
        .then((token) => {
          saveUserAuthSession({
            token,
            uid: user.uid,
            phone: user.phoneNumber ?? undefined,
          });
        })
        .catch(() => emit());
      return;
    }
    emit();
  });

  window.addEventListener("storage", onStorage);
  window.addEventListener(USER_AUTH_CHANGED_EVENT, onStorage);

  return () => {
    unsubscribeFirebase();
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(USER_AUTH_CHANGED_EVENT, onStorage);
  };
}
