import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "YoPartner Media & Publications",
  description:
    "Explore media coverage, articles, and publications about YoPartner and safe, verified platonic companionship in India.",
  path: "/media",
});

export default function MediaLayout({ children }: { children: ReactNode }) {
  return children;
}
