import { LandingHero } from "@/components/marketing/landing-hero";
import { PublicNavbar } from "@/components/marketing/public-navbar";
import { ProblemSection } from "@/components/marketing/problem-section";
import { VirtualLabSection } from "@/components/marketing/virtual-lab-section";
import { InputOutputSection } from "@/components/marketing/input-output-section";
import { AiLearningSection } from "@/components/marketing/ai-learning-section";
import { LearningJourneySection } from "@/components/marketing/learning-journey-section";
import { ProjectShowcaseSection } from "@/components/marketing/project-showcase-section";
import { PricingSection } from "@/components/marketing/pricing-section";
import { FinalCtaSection } from "@/components/marketing/final-cta-section";
import { PublicFooter } from "@/components/marketing/public-footer";

export default function HomePage() {
  return (
    <>
      <PublicNavbar />
      <main id="main-content" tabIndex={-1}>
        <LandingHero />
        <ProblemSection />
        <VirtualLabSection />
        <InputOutputSection />
        <AiLearningSection />
        <LearningJourneySection />
        <ProjectShowcaseSection />
        <PricingSection />
        <FinalCtaSection />
      </main>
      <PublicFooter />
    </>
  );
}
