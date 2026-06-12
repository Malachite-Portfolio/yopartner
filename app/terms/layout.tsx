import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "YoPartner Terms of Use",
  description:
    "Read the terms that govern use of YoPartner's verified, strictly platonic companionship platform and communication services.",
  path: "/terms",
});

export default function TermsLayout({ children }: { children: ReactNode }) {
  return children;
}
