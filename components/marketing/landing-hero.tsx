import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroCircuit } from "./hero-circuit";
import { marketingRoutes } from "./marketing-routes";
import styles from "./homepage.module.css";
import { MotionScene } from "./scenes/motion-scene";

export function LandingHero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className={`${styles.section} ${styles.hero} grid items-center gap-10 lg:min-h-[calc(100svh-5rem)] lg:grid-cols-2 lg:gap-12`}
    >
      <div className="min-w-0">
        <p className="mb-6 flex items-center gap-3 font-mono text-xs font-medium tracking-widest text-text-secondary uppercase">
          <span className="h-px w-8 bg-primary" aria-hidden="true" />
          Virtual lab untuk belajar IoT
        </p>

        <h1
          id="hero-heading"
          className={styles.heroTitle}
        >
          Belajar IoT dengan <span className="text-primary">membangunnya</span> secara langsung.
        </h1>

        <p className="mt-6 max-w-lg text-base leading-relaxed text-text-secondary sm:text-body-lg">
          Susun rangkaian, tulis kode, dan amati responsnya. Hubungkan materi
          dengan praktik dalam satu Virtual Lab.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild className="h-12 px-6 text-base">
            <Link href={marketingRoutes.simulator}>
              Coba Simulator
              <ArrowUpRight aria-hidden="true" className="size-5" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-12 px-6 text-base">
            <Link href={marketingRoutes.learningApp}>
              <BookOpen aria-hidden="true" className="size-5" />
              Mulai Belajar
            </Link>
          </Button>
        </div>

        <p className="mt-3 text-xs text-text-secondary">
          Langsung coba tanpa login. Simulator inti tetap gratis.
        </p>

        <p className="mt-12 hidden flex-wrap items-center gap-3 text-sm text-text-secondary lg:flex">
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
