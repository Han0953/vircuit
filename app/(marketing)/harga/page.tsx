import type { Metadata } from "next";
import Link from "next/link";
import { Check, Minus } from "lucide-react";
import { CtaSection, SimulatorCtaButton } from "@/components/marketing/final-cta-section";
import { marketingRoutes } from "@/components/marketing/marketing-routes";
import { PageHero } from "@/components/marketing/page-hero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Harga",
  description:
    "Skema paket dan akses Vircuit: Simulator inti tetap gratis untuk semua pengguna, dengan opsi Premium untuk kapasitas AI lebih besar.",
};

const freeFeatures = [
  "Core Virtual Lab tanpa batas waktu penggunaan",
  "Akses mode tamu langsung pakai tanpa login",
  "Penyimpanan project lokal & cloud setelah login",
  "Board utama: Arduino Uno, Arduino Nano, dan ESP32",
  "Koleksi breadboard, komponen dasar, sensor & aktuator inti",
  "Editor kode C/C++ terintegrasi dengan Serial Monitor",
  "Akses alur belajar dan tantangan level dasar",
  "Asistensi AI Tutor & AI Debugger dengan kuota terbatas",
];

const premiumFeatures = [
  "Seluruh fitur dan akses paket Free",
  "Kuota interaksi AI Tutor & Debugger lebih besar",
  "Akses modul proyek lanjutan & materi capstone",
  "Tantangan berskala sistem integrasi mendalam",
  "Fitur ekspor ringkasan skematik dan dokumentasi sirkuit",
  "Prioritas kapasitas komputasi simulasi saat beban tinggi",
];

const comparisonRows = [
  { item: "Akses Virtual Lab & Simulator Inti", free: "Ya, penuh", premium: "Ya, penuh" },
  { item: "Akses Tamu (Tanpa Login)", free: "Ya", premium: "Ya" },
  { item: "Penyimpanan Proyek ke Akun", free: "Tersedia", premium: "Tersedia" },
  { item: "Arduino Uno, Nano, dan ESP32", free: "Tersedia", premium: "Tersedia" },
  { item: "Code Editor & Serial Monitor", free: "Tersedia", premium: "Tersedia" },
  { item: "Materi Belajar & Tantangan Dasar", free: "Tersedia", premium: "Tersedia" },
  { item: "Materi Proyek Lanjutan & Capstone", free: "Sebagian pratinjau", premium: "Akses penuh" },
  { item: "Kuota Bimbingan AI", free: "Kuota harian terbatas", premium: "Kapasitas diperluas" },
  { item: "Metode Pembayaran", free: "Gratis selamanya", premium: "Akan diumumkan" },
];

const faqs = [
  {
    q: "Apakah Virtual Lab inti benar-benar gratis?",
    a: "Ya. Salah satu prinsip utama Vircuit adalah menjaga simulator sirkuit, wiring, dan eksekusi kode tetap terbuka dan dapat diakses siapa pun tanpa harus berlangganan.",
  },
  {
    q: "Mengapa fitur AI memiliki batasan kuota?",
    a: "Pemanggilan model AI membutuhkan sumber daya server. Batasan kuota memastikan layanan tetap stabil dan adil bagi seluruh pembelajar.",
  },
  {
    q: "Berapa biaya langganan Premium?",
    a: "Biaya paket Premium belum ditentukan secara final. Kami tidak mempublikasikan estimasi harga sebelum seluruh infrastruktur dan opsi pembayaran siap.",
  },
  {
    q: "Apakah saya bisa belajar tanpa menggunakan fitur AI?",
    a: "Tentu. Vircuit menyediakan inspeksi error deterministik melalui panel Problems, skematik sirkuit, dan materi pembelajaran yang dapat dipelajari secara mandiri.",
  },
];

export function HargaPage() {
  return (
    <>
      <PageHero
        id="harga-hero-heading"
        eyebrow="Akses & Skema Paket"
        title={
          <>
            Praktik inti tetap gratis. <span className="text-primary">Perluas kapasitas saat kamu siap.</span>
          </>
        }
        description="Vircuit berkomitmen menyediakan akses simulator IoT secara inklusif. Pelajari apa yang tersedia di paket Free dan rencana perluasan pada paket Premium."
        actions={
          <>
            <SimulatorCtaButton label="Mulai Gratis Sekarang" />
            <Button asChild variant="outline" className="h-12 px-6">
              <Link href={marketingRoutes.login}>Daftar Akun Gratis</Link>
            </Button>
          </>
        }
        note="Tidak ada kartu kredit atau pembayaran yang dibutuhkan untuk memulai."
      />

      {/* Plan Cards */}
      <section aria-labelledby="plans-heading" className="mx-auto max-w-7xl px-4 py-12 sm:px-8 sm:py-16">
        <h2 id="plans-heading" className="sr-only">
          Pilihan Paket
        </h2>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Free Tier */}
          <article className="flex flex-col justify-between rounded-xl border-2 border-primary bg-surface p-6 sm:p-10">
            <div>
              <div className="flex items-center justify-between">
                <Badge variant="default" className="font-mono text-xs">
                  Paket Utama
                </Badge>
                <span className="font-mono text-xs text-text-secondary">AKSES INTI</span>
              </div>

              <h3 className="mt-4 text-3xl font-bold tracking-tight">Free</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                Fondasi lengkap untuk belajar, merangkai, memprogram, dan bereksperimen dengan sirkuit virtual.
              </p>

              <div className="mt-6 border-y py-4">
                <p className="text-2xl font-bold tracking-tight">Rp 0</p>
                <p className="text-xs text-text-secondary">Gratis selamanya untuk fitur inti simulator</p>
              </div>

              <ul className="mt-6 space-y-3 text-sm">
                {freeFeatures.map((feat) => (
                  <li key={feat} className="flex items-start gap-3">
                    <Check className="size-4 shrink-0 text-primary mt-0.5" aria-hidden="true" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 border-t pt-6">
              <Button asChild className="w-full h-11">
                <Link href={marketingRoutes.simulator}>Coba Simulator Gratis</Link>
              </Button>
            </div>
          </article>

          {/* Premium Tier */}
          <article className="flex flex-col justify-between rounded-xl border bg-surface p-6 sm:p-10">
            <div>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="font-mono text-xs">
                  Segera Hadir
                </Badge>
                <span className="font-mono text-xs text-text-secondary">KAPASITAS EKSTRA</span>
              </div>

              <h3 className="mt-4 text-3xl font-bold tracking-tight">Premium</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                Untuk eksplorasi lanjutan, proyek otomasi berskala besar, dan pendampingan AI lebih intensif.
              </p>

              <div className="mt-6 border-y py-4">
                <p className="text-xl font-bold tracking-tight">Harga akan diumumkan</p>
                <p className="text-xs text-text-secondary">Status paket dalam tahap penyusunan kebijakan</p>
              </div>

              <ul className="mt-6 space-y-3 text-sm">
                {premiumFeatures.map((feat) => (
                  <li key={feat} className="flex items-start gap-3">
                    <Check className="size-4 shrink-0 text-text-secondary mt-0.5" aria-hidden="true" />
                    <span className="text-foreground">{feat}</span>
                  </li>
                ))}
                <li className="flex items-start gap-3 text-text-secondary">
                  <Minus className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>Sistem pembayaran sedang disiapkan</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 border-t pt-6">
              <Button disabled variant="outline" className="w-full h-11">
                Segera Hadir
              </Button>
            </div>
          </article>
        </div>
      </section>

      {/* Comparison Table */}
      <section aria-labelledby="comparison-heading" className="border-t bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-8 lg:py-24">
          <div className="max-w-2xl">
            <p className="font-mono text-xs font-medium tracking-widest text-text-secondary uppercase">
              Perbandingan Rinci
            </p>
            <h2 id="comparison-heading" className="mt-2 text-h2 font-semibold tracking-tight">
              Tabel Matriks Akses
            </h2>
            <p className="mt-3 text-sm text-text-secondary">
              Transparansi hak akses antara pengguna gratis dan rencana fasilitas akun Premium.
            </p>
          </div>

          <div className="mt-10 overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b bg-background">
                  <th scope="col" className="p-4 font-semibold">Fitur & Fasilitas</th>
                  <th scope="col" className="p-4 font-semibold text-primary">Free</th>
                  <th scope="col" className="p-4 font-semibold text-text-secondary">Premium (Rencana)</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {comparisonRows.map((row) => (
                  <tr key={row.item} className="hover:bg-background/50">
                    <td className="p-4 font-medium">{row.item}</td>
                    <td className="p-4 text-text-secondary">{row.free}</td>
                    <td className="p-4 text-text-secondary">{row.premium}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section aria-labelledby="faq-heading" className="border-t">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-8 lg:py-24">
          <div className="max-w-2xl">
            <p className="font-mono text-xs font-medium tracking-widest text-text-secondary uppercase">
              Pertanyaan Umum
            </p>
            <h2 id="faq-heading" className="mt-2 text-h2 font-semibold tracking-tight">
              Seputar Akses & Layanan
            </h2>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {faqs.map((faq) => (
              <div key={faq.q} className="rounded-lg border bg-surface p-6">
                <h3 className="font-semibold text-base">{faq.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CtaSection
        id="harga-cta-heading"
        eyebrow="Tanpa Biaya Awal"
        title="Mulai praktikum tanpa hambatan biaya."
        description="Buka Virtual Lab Vircuit sekarang juga dan mulai rakit sirkuit pertamamu secara gratis."
        actions={
          <>
            <SimulatorCtaButton label="Buka Simulator Langsung" />
            <Button asChild variant="outline" className="h-12 px-6">
              <Link href={marketingRoutes.features}>Pelajari Fitur Lengkap</Link>
            </Button>
          </>
        }
        note="Tidak ada komitmen biaya apa pun pada tahap MVP."
      />
    </>
  );
}

export default HargaPage;
