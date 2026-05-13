import { PageHero } from "@/components/PageHero";
import { CompanionSection } from "@/components/CompanionSection";

export default function CompanionsPage() {
  return (
    <>
      <PageHero
        title="Meet Verified YoPartner Companions"
        subtitle="Browse trusted companions for conversation, support, activities, and safe in-person sessions."
      />
      <CompanionSection
        showHeader={false}
        note="Profiles shown are demo data for now."
      />
    </>
  );
}



