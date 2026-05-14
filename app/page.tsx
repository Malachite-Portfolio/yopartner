import { CompanionSection } from "@/components/CompanionSection";
import { HeroSection } from "@/components/HeroSection";
import { TrustSafety } from "@/components/TrustSafety";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <CompanionSection variant="compact" />
      <TrustSafety />
    </>
  );
}

