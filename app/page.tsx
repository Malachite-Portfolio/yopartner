import { FAQSection } from "@/components/FAQSection";
import { HeroSection } from "@/components/HeroSection";
import { HomeWellnessSections } from "@/components/HomeWellnessSections";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <HomeWellnessSections />
      <FAQSection />
    </>
  );
}
