import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Become a Verified Companion on YoPartner",
  description:
    "Join YoPartner as a verified companion and help people through respectful platonic conversations, chat, audio calls, and video calls.",
  path: "/become-companion",
});

export default function BecomeCompanionLayout({ children }: { children: ReactNode }) {
  return children;
}
