import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "YoPartner Support - Help & Safety",
  description:
    "Get help with your YoPartner account, sessions, payments, privacy, safety reports, or becoming a verified companion.",
  path: "/support",
});

export default function SupportLayout({ children }: { children: ReactNode }) {
  return children;
}
