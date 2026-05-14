import { PageHero } from "@/components/PageHero";
import { CompanionSection } from "@/components/CompanionSection";

export default function CompanionsPage() {
  return (
    <>
      <PageHero
        title="Meet Verified YoPartner Companions"
        subtitle="Browse trusted companions for conversation, support, and meaningful listening sessions."
      />
      <CompanionSection
        showHeader={false}
        note="Verified companions will appear here after approval."
      />
    </>
  );
}



