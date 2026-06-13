import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/seo";

export const metadata = {
  ...createPageMetadata({
    title: "About Us | YoPartner FAQs",
    description:
      "Find answers about YoPartner, verified profiles, strictly platonic companionship, chat, audio calls, video calls, safety, payments, and partner onboarding.",
    path: "/about",
  }),
  title: {
    absolute: "About Us | YoPartner FAQs",
  },
};

export default function AboutLayout({ children }: { children: ReactNode }) {
  return children;
}
