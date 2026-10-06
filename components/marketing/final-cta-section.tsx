import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { marketingRoutes } from "./marketing-routes";
import styles from "./landing-sections.module.css";

/**
 * Reusable CTA banner placed at the bottom of marketing pages.
 *
 * Implements DESIGN.md Section 8 & 19.9:
 * - Employs a subtle PCB grid backdrop (.circuitBackground) with linear opacity mask
 * - Provides structured slots for eyebrow, H2 heading, descriptive body, and primary/secondary action buttons
 * - Includes an optional fine-print note for disclaimers or status indicators
 */
export function CtaSection({ id, eyebrow, title, description, actions, note }: {
  /** Heading identifier used for aria-labelledby attribute */
  id: string;
  /** Numerical step or category eyebrow tag */
  eyebrow: string;
  /** Primary invitation headline */
  title: string;
  /** Body text offering concise next-step guidance */
  description: string;
  /** Interactive button elements (primary CTA + optional secondary links) */
  actions: ReactNode;
  /** Optional secondary footnote */
  note?: string;
}) {
  return (
    <section aria-labelledby={id} className={`relative isolate overflow-hidden border-t ${styles.circuitBackground}`}>
      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-8 lg:py-24">
        <div className="max-w-2xl">
          <p className="mb-4 font-mono text-xs tracking-widest text-text-secondary uppercase">
            {eyebrow}
          </p>
          <h2 id={id} className="text-h1 font-semibold leading-(--leading-heading) tracking-tight text-balance">
            {title}
          </h2>
          <p className="mt-5 max-w-lg leading-relaxed text-text-secondary">
            {description}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {actions}
          </div>
          {note && (
            <p className="mt-4 text-xs text-text-secondary">
              {note}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

/**
 * Reusable primary CTA button for entering the Virtual Lab workspace without full-page reloads.
 * Adheres to AGENT.md #16 & DESIGN.md #11: uses Lucide ArrowUpRight icon without emojis.
 */
export function SimulatorCtaButton({ label = "Coba Simulator" }: { label?: string }) {
  return (
    <Button asChild className="h-12 px-6">
      <Link href={marketingRoutes.simulator}>
        {label}
        <ArrowUpRight aria-hidden="true" />
      </Link>
    </Button>
  );
}

/**
 * Standard final call-to-action preset for the homepage.
 * Directs visitors to either the guest simulator entry point (/simulator)
 * or the learning curriculum overview (/belajar).
 */
export function FinalCtaSection() {
  return (
    <CtaSection
      id="final-cta-heading"
      eyebrow="08 / Langkah berikutnya"
      title="Mulai dengan satu rangkaian. Bangun pemahaman berikutnya."
      description="Kenali alur belajar Vircuit dan bersiap untuk bereksperimen di Virtual Lab."
      note="Simulator segera hadir. Jelajahi alur belajarnya terlebih dahulu."
      actions={
        <>
          <SimulatorCtaButton />
          <Button asChild variant="outline" className="h-12 px-6">
            <Link href={marketingRoutes.learn}>
              <BookOpen aria-hidden="true" />
              Mulai Belajar
            </Link>
          </Button>
        </>
      }
    />
  );
}
