import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Talk Now with Verified Companions",
  description:
    "Browse verified YoPartner profiles and start a safe platonic chat, audio call, or video call instantly. No app download needed.",
  path: "/connect-now",
});

export default function ConnectNowLayout({ children }: { children: ReactNode }) {
  return children;
}
