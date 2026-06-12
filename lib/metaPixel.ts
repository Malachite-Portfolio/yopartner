type MetaPixelEventParams = Record<string, string | number | boolean>;

type MetaPixelEvent = {
  eventName: string;
  params?: MetaPixelEventParams;
};

const HOST_PROFILE_NAVIGATION_KEY = "yopartner_meta_host_profile_navigation";
const META_PIXEL_ID = "1756224879086245";

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

export function isCompanionProfilePath(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  return segments[0] === "connect-now" && segments.length > 1;
}

export function shouldTrackCompleteRegistration(wasProfileIncomplete: boolean, alreadyTracked: boolean) {
  return wasProfileIncomplete && !alreadyTracked;
}

export function markTrackedHostProfileNavigation(hostId: string) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(HOST_PROFILE_NAVIGATION_KEY, hostId);
  } catch {
    // Storage can be unavailable in private or restricted browser contexts.
  }
}

export function consumeTrackedHostProfileNavigation(hostId: string) {
  if (typeof window === "undefined") return false;
  try {
    const trackedHostId = window.sessionStorage.getItem(HOST_PROFILE_NAVIGATION_KEY);
    window.sessionStorage.removeItem(HOST_PROFILE_NAVIGATION_KEY);
    return trackedHostId === hostId;
  } catch {
    return false;
  }
}
