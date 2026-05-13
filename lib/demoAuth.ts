import { IS_PRODUCTION_READY_MODE } from "@/lib/config/runtime";

export const DEMO_LOGGED_IN_KEY = "yopartner_demo_logged_in";
export const PROMO_HIDDEN_KEY = "yopartner_promo_hidden";
export const DEMO_PHONE_KEY = "yopartner_demo_phone";
export const DEMO_AUTH_UPDATED_EVENT = "yopartner-demo-auth-updated";

const USER_FIREBASE_UID_KEY = "yopartner_firebase_uid";
const USER_FIREBASE_PHONE_KEY = "yopartner_firebase_phone";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function notifyAuthUpdate() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(DEMO_AUTH_UPDATED_EVENT));
}

export function getDemoLoggedIn() {
  if (!canUseStorage()) return false;
  if (IS_PRODUCTION_READY_MODE) {
    return Boolean(window.localStorage.getItem(USER_FIREBASE_UID_KEY));
  }
  return window.localStorage.getItem(DEMO_LOGGED_IN_KEY) === "true";
}

export function setDemoLoggedIn(value: boolean) {
  if (!canUseStorage()) return;
  if (IS_PRODUCTION_READY_MODE) {
    notifyAuthUpdate();
    return;
  }
  window.localStorage.setItem(DEMO_LOGGED_IN_KEY, value ? "true" : "false");
  notifyAuthUpdate();
}

export function getPromoHidden() {
  if (!canUseStorage()) return false;
  return window.localStorage.getItem(PROMO_HIDDEN_KEY) === "true";
}

export function setPromoHidden(value: boolean) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(PROMO_HIDDEN_KEY, value ? "true" : "false");
  notifyAuthUpdate();
}

export function getDemoPhone() {
  if (!canUseStorage()) return "+919958719363";
  if (IS_PRODUCTION_READY_MODE) {
    return window.localStorage.getItem(USER_FIREBASE_PHONE_KEY) || "+91**********";
  }
  return window.localStorage.getItem(DEMO_PHONE_KEY) || "+919958719363";
}

export function setDemoPhone(phone: string) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(DEMO_PHONE_KEY, phone);
  notifyAuthUpdate();
}

export function subscribeDemoAuthUpdates(onUpdate: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleStorage = (event: Event) => {
    if (event instanceof StorageEvent && event.key) {
      if (
        event.key !== DEMO_LOGGED_IN_KEY &&
        event.key !== PROMO_HIDDEN_KEY &&
        event.key !== DEMO_PHONE_KEY &&
        event.key !== USER_FIREBASE_UID_KEY &&
        event.key !== USER_FIREBASE_PHONE_KEY
      ) {
        return;
      }
    }
    onUpdate();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(DEMO_AUTH_UPDATED_EVENT, handleStorage);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(DEMO_AUTH_UPDATED_EVENT, handleStorage);
  };
}
