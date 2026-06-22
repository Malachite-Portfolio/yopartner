type MetaPixelEventParams = Record<string, string | number | boolean | string[] | number[]>;

type MetaPixelEvent = {
  eventName: string;
  params?: MetaPixelEventParams;
};

type MetaPixelAddToCartParams = {
  value: number;
  currency: "INR";
  content_type: "wallet_recharge";
  content_ids: string[];
};

type MetaPixelCompleteRegistrationParams = {
  content_name: "user_profile_completion";
  status: "completed";
};

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "1944261929610186";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    __metaPixelPendingEvents?: MetaPixelEvent[];
    __metaPixelLastPageViewPath?: string;
  }
}

export function trackMetaPixel(eventName: string, params?: MetaPixelEventParams) {
  if (typeof window === "undefined") return;

  if (typeof window.fbq === "function") {
    try {
      if (eventName === "PageView") {
        window.fbq("trackSingle", META_PIXEL_ID, eventName, params);
      } else {
        window.fbq("track", eventName, params);
      }
    } catch {
      // Tracking failures must never interrupt the user flow.
    }
    return;
  }

  window.__metaPixelPendingEvents ??= [];
  window.__metaPixelPendingEvents.push({ eventName, params });
}

export function trackAddToCart(params: MetaPixelAddToCartParams) {
  if (!Number.isFinite(params.value) || params.value <= 0 || params.content_ids.length === 0) return;
  trackMetaPixel("AddToCart", params);
}

export function trackCompleteRegistration(params: MetaPixelCompleteRegistrationParams) {
  trackMetaPixel("CompleteRegistration", params);
}
