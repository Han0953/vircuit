import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroCircuit } from "./hero-circuit";
import { marketingRoutes } from "./marketing-routes";

export function LandingHero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-12 sm:px-8 sm:py-16 lg:min-h-[calc(100svh-5rem)] lg:grid-cols-2 lg:gap-12 lg:py-20"
    >
      <div className="min-w-0">
        <p className="mb-6 flex items-center gap-3 font-mono text-xs font-medium tracking-widest text-text-secondary uppercase">
          <span className="h-px w-8 bg-primary" aria-hidden="true" />
          Virtual lab untuk belajar IoT
        </p>

        <h1
          id="hero-heading"
          className="max-w-xl text-display font-semibold leading-(--leading-heading) tracking-tight text-balance"
        >
          Ide jadi rangkaian.
          <br />
          <span className="text-primary">Praktik jadi pemahaman.</span>
        </h1>

        <p className="mt-6 max-w-lg text-base leading-relaxed text-text-secondary sm:text-body-lg">
          Belajar IoT bersama Vircuit. Susun komponen, hubungkan kabel, dan pahami
          cara kode menggerakkan rangkaian dalam satu laboratorium virtual.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild className="h-12 px-6 text-base">
            <Link href={marketingRoutes.simulator}>
              Coba Simulator
              <ArrowUpRight aria-hidden="true" className="size-5" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-12 px-6 text-base">
            <Link href={marketingRoutes.learn}>
              <BookOpen aria-hidden="true" className="size-5" />
              Mulai Belajar
            </Link>
          </Button>
        </div>

        <p className="mt-3 text-xs text-text-secondary">
          Virtual Lab sedang dikembangkan. Kenali fitur dan alur belajarnya lebih dulu.
        </p>

        <p className="mt-8 flex flex-wrap items-center gap-3 text-sm text-text-secondary sm:mt-12">
          Rangkai
          <ArrowRight aria-hidden="true" className="size-4 text-border-strong" />
          Coba
          <ArrowRight aria-hidden="true" className="size-4 text-border-strong" />
          Pahami
        </p>
      </div>

      <HeroCircuit />
    </section>
  );
}
