import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "YoPartner Safety - Verified Profiles & Privacy First",
  description:
    "YoPartner protects users with verified profiles, privacy-first communication, clear boundaries, and strictly platonic companionship rules.",
  path: "/trust-safety",
});

export default function TrustSafetyLayout({ children }: { children: ReactNode }) {
  return children;
}
