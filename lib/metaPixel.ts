type MetaPixelEventParams = Record<string, string | number | boolean | string[] | number[]>;

type MetaPixelEvent = {
  eventName: string;
  params?: MetaPixelEventParams;
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
