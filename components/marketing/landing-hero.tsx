import Link from "next/link";
import { SectionBackground } from "./backgrounds/section-background";
import { ArrowRight, ArrowUpRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroCircuit } from "./hero-circuit";
import { marketingRoutes } from "./marketing-routes";
import styles from "./homepage.module.css";
import { MotionScene } from "./scenes/motion-scene";

export function LandingHero() {
  return (
    <section
      data-home-zone="hero"
      aria-labelledby="hero-heading"
      className={`${styles.section} ${styles.hero} grid items-center lg:grid-cols-2 lg:gap-12`}
    >
      <SectionBackground scene="home-hero" />
      <div className="w-full min-w-0">
        <p data-hero-copy className="mb-4 flex items-center gap-3 font-mono text-xs font-medium tracking-widest text-text-secondary uppercase">
          <span className="h-px w-8 bg-primary" aria-hidden="true" />
          Virtual lab untuk belajar IoT
        </p>

        <h1
          id="hero-heading" data-hero-copy
          className={styles.heroTitle}
        >
          Belajar IoT dengan <span className="text-primary">membangunnya</span> secara langsung.
        </h1>

        <p data-hero-copy className="mt-3 max-w-lg text-sm leading-relaxed text-text-secondary sm:mt-4 sm:text-base sm:text-body-lg">
          Susun rangkaian, tulis kode, dan amati responsnya. Hubungkan materi
          dengan praktik dalam satu Virtual Lab.
        </p>

        <div data-hero-copy className="mt-5 flex gap-2.5 sm:mt-6 sm:gap-3">
          <Button asChild className="h-11 px-3.5 text-sm sm:h-12 sm:px-6 sm:text-base">
            <Link href={marketingRoutes.simulator}>
              Buka Virtual Lab
              <ArrowUpRight aria-hidden="true" className="size-4 sm:size-5" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-11 px-3.5 text-sm sm:h-12 sm:px-6 sm:text-base">
            <Link href={marketingRoutes.learningApp}>
              <BookOpen aria-hidden="true" className="size-4 sm:size-5" />
              Mulai Belajar
            </Link>
          </Button>
        </div>

        <p data-hero-copy className="mt-3 text-xs text-text-secondary">
          Langsung coba tanpa login. Simulator inti tetap gratis.
        </p>

        <p data-hero-copy className="mt-6 hidden flex-wrap items-center gap-3 text-sm text-text-secondary lg:flex">
          Rangkai
          <ArrowRight aria-hidden="true" className="size-4 text-border-strong" />
          Coba
          <ArrowRight aria-hidden="true" className="size-4 text-border-strong" />
          Pahami
        </p>
      </div>

      <MotionScene kind="hero"><HeroCircuit /></MotionScene>
    </section>
  );
}
