import { LandingHero } from "@/components/marketing/landing-hero";
import { ProblemSection } from "@/components/marketing/problem-section";
import { VirtualLabSection } from "@/components/marketing/virtual-lab-section";
import type { Metadata } from "next";
import { AiLearningSection } from "@/components/marketing/ai-learning-section";
import { LearningJourneySection } from "@/components/marketing/learning-journey-section";
import { ProjectShowcaseSection } from "@/components/marketing/project-showcase-section";
import { PricingSection } from "@/components/marketing/pricing-section";
import { FinalCtaSection } from "@/components/marketing/final-cta-section";
import styles from "@/components/marketing/homepage.module.css";
import { ChallengeSection } from "@/components/marketing/challenge-section";
import { CatalogShowcase } from "@/components/marketing/scenes/catalog-showcase";
import { HomeScroll } from "@/components/marketing/scenes/home-scroll";
import { BackToTop } from "@/components/marketing/scenes/back-to-top";

export const metadata: Metadata = {
  title: { absolute: "Vircuit — Belajar IoT dengan Membangunnya" },
  description: "Belajar IoT melalui materi, rangkaian, kode, dan simulasi edukatif. Coba Virtual Lab tanpa login, latih pemahaman lewat challenge, dan belajar bersama Cirra.",
};

export default function HomePage() {
  return (
    <div className={styles.home}>
      <HomeScroll />
      <BackToTop />
      <LandingHero />
      <ProblemSection />
      <LearningJourneySection />
      <CatalogShowcase />
      <VirtualLabSection />
      <AiLearningSection />
      <ChallengeSection />
      <ProjectShowcaseSection />
      <PricingSection />
      <FinalCtaSection />
    </div>
  );
}
