import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "How YoPartner Works - Chat, Audio & Video Calls",
  description:
    "See how YoPartner helps you connect with verified companions through simple web-based chat, audio calls, and video calls.",
  path: "/how-it-works",
});

export default function HowItWorksLayout({ children }: { children: ReactNode }) {
  return children;
}
