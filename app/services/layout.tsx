import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "YoPartner Services - Chat, Audio & Video Companionship",
  description:
    "Explore safe, strictly platonic companionship on YoPartner through verified chat, audio calls, and video calls. No app needed.",
  path: "/services",
});

export default function ServicesLayout({ children }: { children: ReactNode }) {
  return children;
}
