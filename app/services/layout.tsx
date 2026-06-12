import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "YoPartner Services - Chat, Audio & Video Companionship",
  description:
    "Explore safe platonic companionship on YoPartner through verified chat, audio calls, video calls, and approved home visits.",
  path: "/services",
});

export default function ServicesLayout({ children }: { children: ReactNode }) {
  return children;
}
