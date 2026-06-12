type MetaPixelEventParams = Record<string, string | number | boolean>;

type MetaPixelEvent = {
  eventName: string;
  params?: MetaPixelEventParams;
};

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
    window.fbq("track", eventName, params);
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
