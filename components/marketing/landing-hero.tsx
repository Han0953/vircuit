import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroCircuit } from "./hero-circuit";
import { marketingRoutes } from "./marketing-routes";

/**
 * Primary Landing Hero component for the Vircuit marketing homepage (PRD WEB-1 & DESIGN.md Section 19.1).
 *
 * Design and Layout Decisions:
 * - Viewport adaptation: Occupies min-h-[calc(100svh-5rem)] on desktop (accounting for navbar height).
 * - Mobile-first layout: 1-column on viewports <1024px with copy stacking above the circuit visual,
 *   expanding into a balanced 2-column grid on desktop.
 * - Call-to-actions: Primary button routes directly to `/simulator` (guest entry point)
 *   while the secondary button routes to `/belajar` (learning overview).
 * - Performance: Couples with HeroCircuit vector SVG to eliminate render-blocking 3D dependencies.
 */
export function LandingHero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-12 sm:px-8 sm:py-16 lg:min-h-[calc(100svh-5rem)] lg:grid-cols-2 lg:gap-12 lg:py-20"
    >
      <div className="min-w-0">
        {/* Category tag indicating Virtual Lab context */}
        <p className="mb-6 flex items-center gap-3 font-mono text-xs font-medium tracking-widest text-text-secondary uppercase">
          <span className="h-px w-8 bg-primary" aria-hidden="true" />
          Virtual lab untuk belajar IoT
        </p>

        {/* Main headline adhering to typography tokens in tokens.css */}
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

        {/* Direct route CTAs without anchor hash jumps */}
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

        {/* Core educational triad breadcrumb */}
        <p className="mt-8 flex flex-wrap items-center gap-3 text-sm text-text-secondary sm:mt-12">
          Rangkai
          <ArrowRight aria-hidden="true" className="size-4 text-border-strong" />
          Coba
          <ArrowRight aria-hidden="true" className="size-4 text-border-strong" />
          Pahami
        </p>
      </div>

      {/* Hero interactive vector circuit diagram */}
      <HeroCircuit />
    </section>
  );
}
