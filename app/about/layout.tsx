import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "About YoPartner - Safe Platonic Companionship",
  description:
    "Learn about YoPartner's mission to provide safe, verified, and respectful platonic companionship through chat, audio, and video calls.",
  path: "/about",
});

export default function AboutLayout({ children }: { children: ReactNode }) {
  return children;
}
