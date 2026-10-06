import { Check, Minus } from "lucide-react";
import { marketingRoutes } from "./marketing-routes";
import { SectionHeading } from "./section-heading";
import { SectionLink } from "./section-link";

/**
 * Pricing / Freemium preview section on the homepage (PRD Section 6.14 & AGENT.md #54).
 *
 * Core principles enforced here:
 * 1. The core simulator remains fully accessible on Free without paywalls.
 * 2. Premium expands AI request quotas and provides access to complex advanced capstone materials.
 * 3. Never display fictitious pricing numbers; clearly state "Harga belum ditentukan" until finalized.
 */
export function PricingSection() {
  return (
    <section aria-labelledby="pricing-heading" className="border-t">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-8 lg:py-24">
        <SectionHeading
          id="pricing-heading"
          eyebrow="07 / Akses & Freemium"
          title="Mulai dari Free. Perluas saat dibutuhkan."
          description="Core simulator tetap Free. Premium direncanakan untuk memperluas kapasitas AI dan akses ke sebagian konten lanjutan."
        />
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {/* Free Tier Card: core features accessible to all learners */}
          <article className="rounded-lg border border-primary bg-surface p-6 sm:p-8">
            <p className="mb-5 font-mono text-xs text-text-secondary">AKSES INTI</p>
            <h3 className="text-h3 font-semibold">Free</h3>
            <p className="mt-3 text-sm text-text-secondary">Fondasi untuk belajar dan bereksperimen.</p>
            <ul className="mt-8 space-y-4 text-sm">
              {[
                "Core simulator tanpa Premium",
                "Rencana akses guest tanpa login",
                "Simpan project dan pembelajaran inti setelah login",
                "AI setelah login dengan kuota terbatas",
              ].map((text) => (
                <li key={text} className="flex gap-3">
                  <Check className="size-5 shrink-0 text-primary" aria-hidden="true" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </article>

          {/* Premium Tier Card: quota expansions and advanced project templates */}
          <article className="rounded-lg border bg-surface p-6 sm:p-8">
            <p className="mb-5 font-mono text-xs text-text-secondary">PERLUASAN AKSES</p>
            <h3 className="text-h3 font-semibold">Premium</h3>
            <p className="mt-3 text-sm text-text-secondary">Untuk eksplorasi yang lebih mendalam.</p>
            <ul className="mt-8 space-y-4 text-sm">
              {[
                "Seluruh akses inti Free",
                "Kuota AI lebih besar",
                "Sebagian materi, project, dan challenge lanjutan",
              ].map((text) => (
                <li key={text} className="flex gap-3">
                  <Check className="size-5 shrink-0 text-text-secondary" aria-hidden="true" />
                  <span>{text}</span>
                </li>
              ))}
              <li className="flex gap-3 text-text-secondary">
                <Minus className="size-5 shrink-0" aria-hidden="true" />
                <span>Harga belum ditentukan</span>
              </li>
            </ul>
          </article>
        </div>

        <p className="mt-6 max-w-3xl text-sm leading-relaxed text-text-secondary">
          Gambaran paket masih konseptual; belum tersedia pembelian. Harga, jumlah kuota AI, batas penyimpanan project, dan daftar konten Premium akan ditentukan kemudian.
        </p>

        {/* Navigation to dedicated pricing & comparison matrix page */}
        <SectionLink href={marketingRoutes.pricing} className="mt-6">
          Lihat Paket
        </SectionLink>
      </div>
    </section>
  );
}
