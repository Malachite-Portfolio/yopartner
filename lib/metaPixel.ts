"use client";

type MetaPixelFunction = (
  command: "track",
  eventName: string,
  params?: Record<string, unknown>,
) => void;

type WindowWithMetaPixel = Window & {
  fbq?: MetaPixelFunction;
};

const HOST_PROFILE_NAVIGATION_KEY = "yopartner_meta_host_profile_navigation";

export function trackMetaPixel(eventName: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return false;

  const fbq = (window as WindowWithMetaPixel).fbq;
  if (typeof fbq !== "function") return false;

  try {
    fbq("track", eventName, params);
    return true;
  } catch {
    return false;
  }
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
