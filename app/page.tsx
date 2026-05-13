import { CompanionSection } from "@/components/CompanionSection";
import { FAQSection } from "@/components/FAQSection";
import { HeroSection } from "@/components/HeroSection";
import { HowItWorks } from "@/components/HowItWorks";
import { ServicesSection } from "@/components/ServicesSection";
import { StatsStrip } from "@/components/StatsStrip";
import { Testimonials } from "@/components/Testimonials";
import { TrustSafety } from "@/components/TrustSafety";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <StatsStrip />
      <HowItWorks />
      <ServicesSection />
      <CompanionSection variant="compact" />
      <TrustSafety />
      <Testimonials />
      <FAQSection />
    </>
  );
}



