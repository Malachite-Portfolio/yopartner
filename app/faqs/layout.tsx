import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "YoPartner FAQ - Questions About Verified Companionship",
  description:
    "Find answers about YoPartner profiles, safety, privacy, payments, chat, audio calls, video calls, and platonic companionship.",
  path: "/faqs",
});

export default function FAQsLayout({ children }: { children: ReactNode }) {
  return children;
}
