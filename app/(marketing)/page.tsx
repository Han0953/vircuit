import { LandingHero } from "@/components/marketing/landing-hero";
import { ProblemSection } from "@/components/marketing/problem-section";
import { VirtualLabSection } from "@/components/marketing/virtual-lab-section";
import type { Metadata } from "next";
import { AiLearningSection } from "@/components/marketing/ai-learning-section";
import { LearningJourneySection } from "@/components/marketing/learning-journey-section";
import { ProjectShowcaseSection } from "@/components/marketing/project-showcase-section";
import { PricingSection } from "@/components/marketing/pricing-section";
import { FinalCtaSection } from "@/components/marketing/final-cta-section";
import { ChallengeSection } from "@/components/marketing/challenge-section";
import { BoardShowcase } from "@/components/marketing/scenes/board-showcase";
import { HomepageExperience } from "@/components/marketing/scenes/homepage-experience";

export const metadata: Metadata = {
  title: { absolute: "Vircuit — Belajar IoT dengan Membangunnya" },
  description: "Belajar IoT melalui materi, rangkaian, kode, dan simulasi edukatif. Coba Virtual Lab tanpa login, latih pemahaman lewat challenge, dan belajar bersama Cirra.",
};

export default function HomePage() {
  return (
    <HomepageExperience>
      <LandingHero />
      <ProblemSection />
      <LearningJourneySection />
      <BoardShowcase />
      <VirtualLabSection />
      <AiLearningSection />
      <ChallengeSection />
      <ProjectShowcaseSection />
      <PricingSection />
      <FinalCtaSection />
    </HomepageExperience>
  );
}
