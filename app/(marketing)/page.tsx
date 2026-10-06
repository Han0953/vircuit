import { LandingHero } from "@/components/marketing/landing-hero";
import { ProblemSection } from "@/components/marketing/problem-section";
import { VirtualLabSection } from "@/components/marketing/virtual-lab-section";
import { InputOutputSection } from "@/components/marketing/input-output-section";
import { AiLearningSection } from "@/components/marketing/ai-learning-section";
import { LearningJourneySection } from "@/components/marketing/learning-journey-section";
import { ProjectShowcaseSection } from "@/components/marketing/project-showcase-section";
import { PricingSection } from "@/components/marketing/pricing-section";
import { FinalCtaSection } from "@/components/marketing/final-cta-section";

/**
 * Public Homepage for Vircuit (Route: `/`).
 *
 * Implements PRD.md Section 6.1 (WEB-1) & DESIGN.md Section 19:
 * Acts as the high-level overview of the entire Vircuit ecosystem.
 * Rather than holding monolithic content, each section provides a focused preview
 * with low-emphasis preview links (`SectionLink`) directing users to the respective
 * in-depth pages:
 * - Virtual Lab preview -> `/fitur`
 * - Learning Journey preview -> `/belajar`
 * - Project Showcase preview -> `/jelajahi`
 * - Pricing overview -> `/harga`
 *
 * The shared `PublicNavbar` and `PublicFooter` are provided automatically
 * by the parent `(marketing)/layout.tsx`.
 */
export default function HomePage() {
  return (
    <>
      <LandingHero />
      <ProblemSection />
      <VirtualLabSection />
      <InputOutputSection />
      <AiLearningSection />
      <LearningJourneySection />
      <ProjectShowcaseSection />
      <PricingSection />
      <FinalCtaSection />
    </>
  );
}
