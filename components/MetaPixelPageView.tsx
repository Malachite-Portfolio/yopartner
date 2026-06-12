"use client";

import { useEffect } from "react";
import { isCompanionProfilePath, trackMetaPixel } from "@/lib/metaPixel";

export function MetaPixelPageView() {
  useEffect(() => {
    const trackCurrentPath = () => {
      const pathname = window.location.pathname;
      if (window.__metaPixelLastPageViewPath === pathname) return;
      window.__metaPixelLastPageViewPath = pathname;

      if (!isCompanionProfilePath(pathname)) {
        trackMetaPixel("PageView");
      }
    };

    const schedulePageView = () => {
      window.setTimeout(trackCurrentPath, 0);
    };

    const pathnameWatcher = window.setInterval(trackCurrentPath, 250);
    window.addEventListener("popstate", schedulePageView);
    trackCurrentPath();

    return () => {
      window.clearInterval(pathnameWatcher);
      window.removeEventListener("popstate", schedulePageView);
    };
  }, []);

  return null;
}
