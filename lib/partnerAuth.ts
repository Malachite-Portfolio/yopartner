export const PARTNER_LOGGED_IN_KEY = "yopartner_partner_logged_in";
export const PARTNER_PHONE_KEY = "yopartner_partner_phone";
export const PARTNER_PROFILE_KEY = "yopartner_partner_profile";
export const PARTNER_ONBOARDING_COMPLETE_KEY = "yopartner_partner_onboarding_complete";
export const PARTNER_ONLINE_KEY = "yopartner_partner_online";
export const PARTNER_SESSIONS_KEY = "yopartner_partner_sessions";
export const PARTNER_MESSAGES_KEY = "yopartner_partner_messages";
export const PARTNER_BOOKINGS_KEY = "yopartner_partner_bookings";
export const PARTNER_EARNINGS_KEY = "yopartner_partner_earnings";
export const PARTNER_SETTINGS_KEY = "yopartner_partner_settings";
export const PARTNER_PROFILE_DRAFT_KEY = "yopartner_partner_profile_draft";
export const PARTNER_ONLINE_STATUS_EVENT = "yopartner:partner-online-status";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readJSON<T>(key: string, fallback: T): T {
  if (!canUseStorage()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return (parsed as T) ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeJSON<T>(key: string, value: T) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function isPartnerLoggedIn() {
  if (!canUseStorage()) return false;
  return window.localStorage.getItem(PARTNER_LOGGED_IN_KEY) === "true";
}

export function loginPartner(phone: string) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(PARTNER_LOGGED_IN_KEY, "true");
  window.localStorage.setItem(PARTNER_PHONE_KEY, phone.trim());
}

export function logoutPartner() {
  if (!canUseStorage()) return;
  window.localStorage.setItem(PARTNER_LOGGED_IN_KEY, "false");
}

export function getPartnerPhone() {
  if (!canUseStorage()) return "";
  return window.localStorage.getItem(PARTNER_PHONE_KEY) ?? "";
}

export function savePartnerProfile<T>(profile: T) {
  writeJSON(PARTNER_PROFILE_KEY, profile);
}

export function getPartnerProfile<T>(fallback: T): T {
  return readJSON(PARTNER_PROFILE_KEY, fallback);
}

export function savePartnerDraft<T>(draft: T) {
  writeJSON(PARTNER_PROFILE_DRAFT_KEY, draft);
}

export function getPartnerDraft<T>(fallback: T): T {
  return readJSON(PARTNER_PROFILE_DRAFT_KEY, fallback);
}

export function isPartnerOnboardingComplete() {
  if (!canUseStorage()) return false;
  return window.localStorage.getItem(PARTNER_ONBOARDING_COMPLETE_KEY) === "true";
}

export function setPartnerOnboardingComplete(value: boolean) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(PARTNER_ONBOARDING_COMPLETE_KEY, value ? "true" : "false");
}

export function getPartnerOnlineStatus() {
  if (!canUseStorage()) return false;
  return window.localStorage.getItem(PARTNER_ONLINE_KEY) === "true";
}

export function setPartnerOnlineStatus(value: boolean) {
  if (!canUseStorage()) return;
  const previousValue = window.localStorage.getItem(PARTNER_ONLINE_KEY);
  const nextValue = value ? "true" : "false";
  window.localStorage.setItem(PARTNER_ONLINE_KEY, nextValue);
  window.dispatchEvent(new CustomEvent<boolean>(PARTNER_ONLINE_STATUS_EVENT, { detail: value }));
  try {
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: PARTNER_ONLINE_KEY,
        oldValue: previousValue,
        newValue: nextValue,
        storageArea: window.localStorage,
      }),
    );
  } catch {
    // Some environments may not allow constructing StorageEvent; custom event above still syncs same-tab UI.
  }
}

export function subscribePartnerOnlineStatus(listener: (value: boolean) => void) {
  if (!canUseStorage()) return () => undefined;

  const syncFromStorage = () => {
    listener(getPartnerOnlineStatus());
  };

  const onCustomEvent = (event: Event) => {
    const customEvent = event as CustomEvent<boolean>;
    if (typeof customEvent.detail === "boolean") {
      listener(customEvent.detail);
      return;
    }
    syncFromStorage();
  };

  const onStorageEvent = (event: StorageEvent) => {
    if (event.key !== PARTNER_ONLINE_KEY) return;
    syncFromStorage();
  };

  const onFocus = () => {
    syncFromStorage();
  };

  window.addEventListener(PARTNER_ONLINE_STATUS_EVENT, onCustomEvent as EventListener);
  window.addEventListener("storage", onStorageEvent);
  window.addEventListener("focus", onFocus);

  return () => {
    window.removeEventListener(PARTNER_ONLINE_STATUS_EVENT, onCustomEvent as EventListener);
    window.removeEventListener("storage", onStorageEvent);
    window.removeEventListener("focus", onFocus);
  };
}
