import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "YoPartner Client Diaries - Connection Stories",
  description:
    "Read stories about respectful conversation, trusted human connection, and safe platonic companionship through YoPartner.",
  path: "/client-diaries",
});

export default function ClientDiariesLayout({ children }: { children: ReactNode }) {
  return children;
}
