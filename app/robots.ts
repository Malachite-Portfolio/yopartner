import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/api",
        "/bookings",
        "/call",
        "/chat",
        "/dashboard",
        "/dev-tools",
        "/home-visit/",
        "/login",
        "/my-profile",
        "/onboarding",
        "/otp",
        "/partner",
        "/partner-dashboard",
        "/review",
        "/sign-in",
        "/signup",
        "/svga-test",
        "/wallet",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
