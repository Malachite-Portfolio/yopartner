import { PartnerGuard } from "@/components/partner/PartnerGuard";
import { PartnerShell } from "@/components/partner/PartnerShell";

export default function PartnerPanelLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <PartnerGuard requireOnboarding>
      <PartnerShell>{children}</PartnerShell>
    </PartnerGuard>
  );
}
