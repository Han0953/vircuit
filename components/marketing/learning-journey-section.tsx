import { ArrowRight } from "lucide-react";
import { marketingRoutes } from "./marketing-routes";
import { SectionHeading } from "./section-heading";
import { SectionLink } from "./section-link";

const journey = [
  ["Learn", "Pahami konsep", "Kenali komponen dan tujuan praktik."],
  ["Build", "Susun rangkaian", "Pilih board dan komponen yang diperlukan."],
  ["Wire", "Hubungkan pin", "Bangun koneksi dan telusuri jalurnya."],
  ["Code", "Tulis logika", "Ubah pemahaman menjadi instruksi."],
  ["Simulate", "Amati respons", "Lihat hubungan input dan output."],
  ["Debug", "Perbaiki kesalahan", "Telusuri penyebab dan coba kembali."],
  ["Challenge", "Uji pemahaman", "Terapkan konsep pada tantangan."],
  ["Evaluate", "Tinjau hasil", "Kenali kemajuan dan hal yang perlu dilatih."],
] as const;

export function LearningJourneySection() {
  return (
    <section aria-labelledby="journey-heading" className="border-t">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-8 lg:py-24">
        <SectionHeading
          id="journey-heading"
          eyebrow="05 / Learning Journey"
          title="Belajar tidak berhenti saat rangkaian menyala."
          description="Alur belajar Vircuit dirancang untuk membawa kamu dari konsep menuju eksperimen, perbaikan, dan evaluasi pemahaman."
        />
        <ol className="mt-10 grid gap-x-8 sm:grid-cols-2 lg:grid-cols-4">
          {journey.map(([name, title, text], index) => (
            <li key={name} className="border-t py-6">
              <p className="flex items-center gap-3 font-mono text-sm">
                <span className="text-primary">0{index + 1}</span>
                {name}
                {index < journey.length - 1 && (
                  <ArrowRight className="ml-auto size-4 text-text-secondary" aria-hidden="true" />
                )}
              </p>
              <h3 className="mt-6 font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">{text}</p>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-xs text-text-secondary">
          Pratinjau alur belajar. Materi, challenge, dan evaluasi sedang disiapkan.
        </p>
        <SectionLink href={marketingRoutes.learn} className="mt-6">
          Pelajari Sistem Belajar
        </SectionLink>
      </div>
    </section>
  );
}
