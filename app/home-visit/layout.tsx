import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Verified Home Visit Companionship",
  description:
    "Browse verified YoPartner profiles available for approved, safety-focused platonic home visit companionship.",
  path: "/home-visit",
});

export default function HomeVisitLayout({ children }: { children: ReactNode }) {
  return children;
}
