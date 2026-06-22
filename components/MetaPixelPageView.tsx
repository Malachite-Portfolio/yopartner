"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackMetaPixel } from "@/lib/metaPixel";

export function MetaPixelPageView() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    if (pathname === "/admin" || pathname.startsWith("/admin/")) {
      window.__metaPixelLastPageViewPath = undefined;
      return;
    }
    if (window.__metaPixelLastPageViewPath === pathname) return;
    window.__metaPixelLastPageViewPath = pathname;
    trackMetaPixel("PageView");
  }, [pathname]);

  return null;
}
