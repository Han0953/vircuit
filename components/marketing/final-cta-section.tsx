import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { marketingRoutes } from "./marketing-routes";
import styles from "./landing-sections.module.css";
import homeStyles from "./homepage.module.css";
import { MotionScene } from "./scenes/motion-scene";

export function CtaSection({
  id,
  eyebrow,
  title,
  description,
  actions,
  note,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  actions: ReactNode;
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

export function FinalCtaSection() {
  return (
    <>
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-8">
        <MotionScene kind="closing">
          <svg viewBox="0 0 480 64" className={homeStyles.closingTrace} fill="none" aria-hidden="true">
            <path data-wire d="M4 32h80l20-20h96l40 40h80l20-20h130" stroke="currentColor" strokeWidth="2" />
            <circle cx="472" cy="32" r="5" fill="currentColor" />
          </svg>
        </MotionScene>
      </div>
      <CtaSection
      id="final-cta-heading"
      eyebrow="Langkah berikutnya / giliran kamu"
      title="Rangkaian pertamamu dimulai dari satu percobaan."
      description="Mulai dari LED sederhana. Temukan hubungan antara rangkaian, kode, dan hasil yang kamu amati."
      note="Coba sebagai tamu. Login saat ingin menyimpan project ke akun."
      actions={
        <>
          <SimulatorCtaButton />
          <Button asChild variant="outline" className="h-12 px-6">
            <Link href={marketingRoutes.learningApp}>
              <BookOpen aria-hidden="true" />
              Mulai Belajar
            </Link>
          </Button>
        </>
      }
      />
    </>
  );
}
