import {
  deletePartnerPushSubscription,
  savePartnerPushSubscription,
  type SerializedPushSubscription,
} from "@/lib/api/partner";

export type PartnerPushResult = {
  ok: boolean;
  permission?: NotificationPermission | "unsupported";
  message: string;
};

export function isPartnerPushFeatureEnabled() {
  return process.env.NEXT_PUBLIC_ENABLE_WEB_PUSH_NOTIFICATIONS === "true";
}

export function isPushNotificationSupported() {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = `${base64String}${padding}`.replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

function serializeSubscription(subscription: PushSubscription): SerializedPushSubscription | null {
  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return null;
  return {
    endpoint: json.endpoint,
    expirationTime: json.expirationTime ?? null,
    keys: {
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
    },
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
  };
}

async function getPartnerServiceWorkerRegistration() {
  const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  return navigator.serviceWorker.ready.then(() => registration);
}

export async function enablePartnerPushNotifications(publicKey?: string | null): Promise<PartnerPushResult> {
  if (!isPartnerPushFeatureEnabled()) {
    return { ok: false, permission: "unsupported", message: "Push notifications are not enabled for this release." };
  }
  if (!isPushNotificationSupported()) {
    return { ok: false, permission: "unsupported", message: "This browser does not support Web Push notifications." };
  }

  const vapidPublicKey = publicKey || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidPublicKey) {
    return { ok: false, message: "Push notifications are not configured yet." };
  }

  const permission = Notification.permission === "default"
    ? await Notification.requestPermission()
    : Notification.permission;
  if (permission !== "granted") {
    return {
      ok: false,
      permission,
      message: permission === "denied"
        ? "Push notifications are blocked in this browser."
        : "Push notification permission was not granted.",
    };
  }

  const registration = await getPartnerServiceWorkerRegistration();
  const existingSubscription = await registration.pushManager.getSubscription();
  const subscription = existingSubscription ?? await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
  });

  const serialized = serializeSubscription(subscription);
  if (!serialized) {
    return { ok: false, permission, message: "Browser did not return a valid push subscription." };
  }

  const response = await savePartnerPushSubscription(serialized);
  if (response.error) {
    return { ok: false, permission, message: response.error.message || "Could not save push subscription." };
  }

  return { ok: true, permission, message: "Push notifications are enabled for incoming requests." };
}

export async function disablePartnerPushNotifications(): Promise<PartnerPushResult> {
  if (!isPartnerPushFeatureEnabled()) {
    return { ok: false, permission: "unsupported", message: "Push notifications are not enabled for this release." };
  }
  if (!isPushNotificationSupported()) {
    const response = await deletePartnerPushSubscription();
    return {
      ok: !response.error,
      permission: "unsupported",
      message: response.error?.message || "Push notifications are disabled.",
    };
  }

  const registration = await navigator.serviceWorker.getRegistration("/");
  const subscription = await registration?.pushManager.getSubscription();
  const endpoint = subscription?.endpoint;
  if (subscription) {
    await subscription.unsubscribe().catch(() => false);
  }

  const response = await deletePartnerPushSubscription(endpoint);
  if (response.error) {
    return { ok: false, message: response.error.message || "Could not disable push notifications." };
  }

  return { ok: true, message: "Push notifications are disabled on this browser." };
}
