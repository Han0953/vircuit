import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  Cpu,
  GraduationCap,
  Lightbulb,
  LogIn,
  RotateCcw,
  ShieldCheck,
  Target,
  Wrench,
  Zap,
} from "lucide-react";
import { CtaSection, SimulatorCtaButton } from "@/components/marketing/final-cta-section";
import { marketingRoutes } from "@/components/marketing/marketing-routes";
import { PageHero } from "@/components/marketing/page-hero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Belajar",
  description:
    "Ikhtisar sistem pembelajaran Vircuit: siklus 8 langkah Learn, Build, Wire, Code, Simulate, Debug, Challenge, Evaluate untuk menguasai IoT secara bertahap.",
};

const learningCycle = [
  {
    step: "01",
    phase: "Learn",
    title: "Pahami Konsep Dasar",
    icon: BookOpen,
    description:
      "Pelajari prinsip kerja komponen, konsep tegangan, sinyal digital vs analog, serta tujuan praktikum yang akan dibangun.",
    outcome: "Memahami mengapa suatu komponen dibutuhkan dan bagaimana perilakunya.",
  },
  {
    step: "02",
    phase: "Build",
    title: "Pilih & Tata Komponen",
    icon: Cpu,
    description:
      "Tempatkan microcontroller, breadboard, sensor, dan aktuator pada workspace secara bebas sesuai rancangan sistem.",
    outcome: "Membiasakan penataan tata letak sirkuit yang rapi dan modular.",
  },
  {
    step: "03",
    phase: "Wire",
    title: "Hubungkan Jalur Sirkuit",
    icon: Zap,
    description:
      "Tarik kabel jumper antar pin dan pahami pembagian rel daya serta sambungan internal breadboard.",
    outcome: "Memahami pemetaan pinout, jalur ground bersama, dan polaritas.",
  },
  {
    step: "04",
    phase: "Code",
    title: "Tulis Logika Program",
    icon: Wrench,
    description:
      "Tulis instruksi C/C++ pada editor kode terintegrasi untuk membaca input sensor dan mengendalikan aktuator.",
    outcome: "Menerjemahkan logika algoritma menjadi instruksi microcontroller.",
  },
  {
    step: "05",
    phase: "Simulate",
    title: "Uji Respons Real-time",
    icon: Lightbulb,
    description:
      "Jalankan simulasi, operasikan tombol atau potensiometer virtual, dan amati respons langsung pada display atau aktuator.",
    outcome: "Melihat relasi sebab-akibat antara masukan dan keluaran secara langsung.",
  },
  {
    step: "06",
    phase: "Debug",
    title: "Telusuri & Perbaiki Masalah",
    icon: RotateCcw,
    description:
      "Saat rangkaian tidak berjalan seperti yang diharapkan, manfaatkan panel Problems dan panduan AI untuk menganalisis akar masalah.",
    outcome: "Mengembangkan ketajaman pemecahan masalah teknis secara metodis.",
  },
  {
    step: "07",
    phase: "Challenge",
    title: "Selesaikan Tantangan Mandiri",
    icon: Target,
    description:
      "Terapkan pemahaman dengan memodifikasi skenario, menangani batasan baru, atau menyelesaikan studi kasus tertentu.",
    outcome: "Menguji kemandirian bernalar tanpa bergantung pada panduan langkah demi langkah.",
  },
  {
    step: "08",
    phase: "Evaluate",
    title: "Evaluasi & Refleksi Kemajuan",
    icon: ShieldCheck,
    description:
      "Sistem memverifikasi kriteria keberhasilan proyek dan memperbarui peta kompetensi kemampuanmu.",
    outcome: "Melihat progres penguasaan skill dan rekomendasi topik selanjutnya.",
  },
];

const pedagogicalPillars = [
  {
    title: "Project-Based Learning",
    badge: "Metodologi",
    description:
      "Tidak ada teori abstrak tanpa konteks. Setiap materi selalu dikaitkan dengan produk atau sistem nyata—dari lampu lalu lintas sederhana, monitoring tanaman pintar, hingga inkubator penetas telur cerdas.",
  },
  {
    title: "Kesalahan Sebagai Sumber Belajar",
    badge: "Filosofi",
    description:
      "Di laboratorium fisik, komponen yang salah pasang bisa terbakar. Di Vircuit, kesalahan wiring dan bug kode menjadi sarana eksplorasi aman untuk memahami alasan teknis di balik batasan rangkaian.",
  },
  {
    title: "Jembatan Menuju Hardware Nyata",
    badge: "Tujuan Akhir",
    description:
      "Vircuit tidak dirancang untuk menggantikan perangkat keras fisik selamanya, melainkan mematangkan pemahaman skematik dan kode sebelum kamu berinvestasi membeli dan merakit alat sesungguhnya.",
  },
];

const skillCompetencies = [
  {
    name: "Elektronika Dasar",
    desc: "Tegangan, arus, resistor, pembagi tegangan, dan proteksi beban.",
  },
  {
    name: "Digital & Analog I/O",
    desc: "Pembacaan status switch, sinyal ADC, serta kendali sinyal PWM.",
  },
  {
    name: "Pengenalan Microcontroller",
    desc: "Spesifikasi pin, konsumsi daya, dan arsitektur Arduino & ESP32.",
  },
  {
    name: "Sensor Lingkungan",
    desc: "Membaca data suhu, kelembapan, intensitas cahaya, dan jarak.",
  },
  {
    name: "Aktuator & Display",
    desc: "Mengendalikan servo motor, relay, buzzer, serta layar output.",
  },
  {
    name: "Logika Pemrograman IoT",
    desc: "Struktur loop non-blocking, timer, state machine, dan pembacaan serial.",
  },
  {
    name: "Debugging Sistematis",
    desc: "Analisis tegangan node, pemeriksaan pin mismatch, dan syntax check.",
  },
  {
    name: "Integrasi Proyek Utuh",
    desc: "Menghubungkan multi-komponen menjadi sistem otomasi terpadu.",
  },
];

export function BelajarPage() {
  return (
    <>
      <PageHero
        id="belajar-hero-heading"
        eyebrow="Sistem Pembelajaran Vircuit"
        title={
          <>
            Belajar dengan membangun. <span className="text-primary">Paham lewat eksperimen langsung.</span>
          </>
        }
        description="Pelajari bagaimana kurikulum dan simulator Vircuit membantumu menguasai Internet of Things secara bertahap melalui siklus 8 tahap terstruktur."
        actions={
          <>
            <SimulatorCtaButton />
            <Button asChild variant="outline" className="h-12 px-6">
              <Link href="/masuk?next=%2Fdashboard%2Flearn">
                <LogIn aria-hidden="true" />
                Mulai belajar
              </Link>
            </Button>
          </>
        }
        note="Ikhtisar ini terbuka untuk umum. Kamu bisa mencoba simulator langsung tanpa akun."
      />

      {/* Siklus 8 Langkah */}
      <section aria-labelledby="cycle-heading" className="mx-auto max-w-7xl px-4 py-16 sm:px-8 lg:py-24">
        <div className="max-w-3xl">
          <p className="font-mono text-xs font-medium tracking-widest text-text-secondary uppercase">
            Alur Inti Pembelajaran
          </p>
          <h2 id="cycle-heading" className="mt-2 text-h2 font-semibold tracking-tight text-balance">
            8 Tahap Menuju Penguasaan IoT
          </h2>
          <p className="mt-4 text-base leading-relaxed text-text-secondary">
            Setiap proyek di Vircuit mengikuti tahapan berurutan dari pemahaman teori hingga evaluasi mandiri,
            memastikan kamu memahami dasar di balik setiap sambungan kabel dan baris kode.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {learningCycle.map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.phase}
                className="flex flex-col justify-between rounded-lg border bg-surface p-6 transition-colors hover:border-primary/50"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-primary">
                      {item.step} / {item.phase.toUpperCase()}
                    </span>
                    <span className="flex size-9 items-center justify-center rounded-md border bg-background text-text-secondary">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                  </div>

                  <h3 className="mt-4 text-lg font-semibold tracking-tight">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-text-secondary">{item.description}</p>
                </div>

                <div className="mt-6 border-t pt-4">
                  <p className="text-[11px] font-mono uppercase text-text-secondary">Capaian:</p>
                  <p className="mt-1 text-xs leading-relaxed text-foreground">{item.outcome}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* 3 Pilar Pembelajaran */}
      <section aria-labelledby="pillars-heading" className="border-t bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-8 lg:py-24">
          <div className="max-w-3xl">
            <p className="font-mono text-xs font-medium tracking-widest text-text-secondary uppercase">
              Pendekatan Edukasi
            </p>
            <h2 id="pillars-heading" className="mt-2 text-h2 font-semibold tracking-tight">
              Tiga Prinsip di Balik Metode Vircuit
            </h2>
            <p className="mt-4 text-base leading-relaxed text-text-secondary">
              Kami merancang pengalaman belajar yang menghargai proses coba-salah tanpa rasa takut merusak peralatan.
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {pedagogicalPillars.map((pillar) => (
              <article key={pillar.title} className="rounded-lg border bg-background p-6 sm:p-8 flex flex-col justify-between">
                <div>
                  <Badge variant="outline" className="font-mono text-xs">
                    {pillar.badge}
                  </Badge>
                  <h3 className="mt-4 text-xl font-semibold tracking-tight">{pillar.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-text-secondary">{pillar.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Matriks Kompetensi */}
      <section aria-labelledby="competencies-heading" className="border-t">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-8 lg:py-24">
          <div className="max-w-3xl">
            <p className="font-mono text-xs font-medium tracking-widest text-text-secondary uppercase">
              Peta Keahlian
            </p>
            <h2 id="competencies-heading" className="mt-2 text-h2 font-semibold tracking-tight">
              Kompetensi yang Akan Kamu Kuasai
            </h2>
            <p className="mt-4 text-base leading-relaxed text-text-secondary">
              Perkembangan skill kamu tercatat secara transparan di dashboard saat kamu menyelesaikan modul pembelajaran dan challenge.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {skillCompetencies.map((skill) => (
              <div key={skill.name} className="rounded-lg border bg-surface p-5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-primary shrink-0" aria-hidden="true" />
                  <h3 className="font-semibold text-sm">{skill.name}</h3>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-text-secondary">{skill.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CtaSection
        id="belajar-cta-heading"
        eyebrow="Mulai Praktik Pertama"
        title="Siap memulai langkah pertama belajarmu?"
        description="Uji coba rangkaian sederhana pada Virtual Lab atau daftarkan akun untuk menyimpan riwayat belajarmu."
        actions={
          <>
            <SimulatorCtaButton label="Buka Virtual Lab" />
            <Button asChild variant="outline" className="h-12 px-6">
              <Link href={marketingRoutes.explore}>
                <GraduationCap aria-hidden="true" />
                Lihat Katalog Proyek
              </Link>
            </Button>
          </>
        }
        note="Akun gratis dapat menyimpan proyek dan mengikuti alur pembelajaran inti."
      />
    </>
  );
}

export default BelajarPage;
