import { PageHero } from "@/components/PageHero";
import { FAQSection } from "@/components/FAQSection";

export default function FAQsPage() {
  return (
    <>
      <PageHero
        title="Frequently Asked Questions"
        subtitle="Everything you need to know about using YoPartner safely."
      />
      <FAQSection showHeading={false} />
    </>
  );
}



