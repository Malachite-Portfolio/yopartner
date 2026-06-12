import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Contact YoPartner",
  description:
    "Contact YoPartner for account help, companion applications, safety reports, and questions about our platonic companionship platform.",
  path: "/contact",
});

export default function ContactLayout({ children }: { children: ReactNode }) {
  return children;
}
