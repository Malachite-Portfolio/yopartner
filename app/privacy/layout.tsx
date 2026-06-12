import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "YoPartner Privacy Policy",
  description:
    "Read how YoPartner handles personal information, platform data, privacy, and security for users and verified companions.",
  path: "/privacy",
});

export default function PrivacyLayout({ children }: { children: ReactNode }) {
  return children;
}
