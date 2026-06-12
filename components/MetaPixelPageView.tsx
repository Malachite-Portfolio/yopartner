"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { isCompanionProfilePath, trackMetaPixel } from "@/lib/metaPixel";

export function MetaPixelPageView() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.__metaPixelLastPageViewPath === pathname) return;
    window.__metaPixelLastPageViewPath = pathname;

    if (!isCompanionProfilePath(pathname)) {
      trackMetaPixel("PageView");
    }
  }, [pathname]);

  return null;
}
