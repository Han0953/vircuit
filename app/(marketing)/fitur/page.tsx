import { FeaturesShowcase } from "@/components/marketing/scenes/features-showcase";
import { PublicMotion } from "@/components/marketing/scenes/public-motion-page";
import { PublicArtwork } from "@/components/marketing/scenes/public-artwork";
import publicStyles from "@/components/marketing/public-pages.module.css";
import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  BookOpen,
  Bug,
  CheckCircle2,
  CircuitBoard,
  Code2,
  Compass,
  Cpu,
  Layers,
  Play,
  TrendingUp,
  Workflow,
} from "lucide-react";
import { CtaSection, SimulatorCtaButton } from "@/components/marketing/final-cta-section";
import { marketingRoutes } from "@/components/marketing/marketing-routes";
import { PageHero } from "@/components/marketing/page-hero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Fitur",
  description:
    "Fitur lengkap Vircuit: Virtual Laboratory, Circuit Builder, Interactive Wiring, Code Editor, Simulasi Real-time, AI Tutor, dan pelacakan progress.",
};

const featureGroups = [
  {
    id: "workspace",
    category: "Lingkungan Eksperimen & Perancangan",
    eyebrow: "01 / Workspace & Rangkaian",
    items: [
      {
        id: "virtual-laboratory",
        icon: CircuitBoard,
        title: "Virtual Laboratory",
        badge: "Core Experience",
        description:
          "Satu lingkungan terpadu yang menyatukan kanvas rangkaian, editor kode, monitor serial, dan simulasi tanpa memerlukan instalasi software rumit atau hardware fisik di tahap awal.",
        highlights: [
          "Akses fleksibel dari desktop maupun perangkat mobile",
          "Mode tamu langsung pakai tanpa wajib login",
          "Workspace terstruktur dengan kanvas bebas dan panel adaptif",
        ],
      },
      {
        id: "circuit-builder",
        icon: Cpu,
        title: "Circuit Builder",
        badge: "Visual Workspace",
        description:
          "Penyusunan komponen bebas dengan mekanisme drag-and-drop, rotasi, seleksi, serta penataan papan microcontroller, breadboard, sensor, aktuator, dan komponen pasif.",
        highlights: [
          "Dukungan board utama: Arduino Uno dan ESP32; Nano sebagai visual-only",
          "Pilihan breadboard mini, half-size, hingga full-size",
          "Komponen pasif dan interaktif: LED, resistor, button, potentiometer",
        ],
      },
      {
        id: "interactive-wiring",
        icon: Workflow,
        title: "Interactive Wiring",
        badge: "Smart Connectivity",
        description:
          "Penghubungan pin-ke-pin interaktif dengan preview kabel dinamis, pemetaan node elektrik internal breadboard, serta identitas logis pin yang tetap terikat saat komponen dipindahkan.",
        highlights: [
          "Identitas pin berbasis logika kelistrikan (componentId.pinId)",
          "Penataan warna kabel kustom untuk kerapian skema",
          "Konektivitas internal lajur daya dan terminal hole breadboard",
        ],
      },
    ],
  },
  {
    id: "runtime",
    category: "Pemrograman & Simulasi Reaktif",
    eyebrow: "02 / Runtime & Pengujian",
    items: [
      {
        id: "code-editor",
        icon: Code2,
        title: "Code Editor",
        badge: "Integrated IDE",
        description:
          "Editor kode terintegrasi dengan penomoran baris, pewarnaan sintaksis, serta subset bahasa Arduino-style C/C++ untuk mengendalikan perilaku rangkaian secara langsung.",
        highlights: [
          "Dukungan fungsi inti: setup(), loop(), pinMode(), digital & analog I/O",
          "Pemisahan workspace kode dan kanvas dengan mode fokus",
          "Validasi sintaksis sebelum eksekusi simulasi",
        ],
      },
      {
        id: "realtime-simulation",
        icon: Play,
        title: "Real-time Simulation",
        badge: "Simulation Engine",
        description:
          "Mesin simulasi yang membaca status sirkuit, instruksi kode, serta manipulasi komponen input secara real-time untuk menghasilkan respons output berdasarkan model simulasi edukatif.",
        highlights: [
          "Eksperimen sebab-akibat: ubah input dan amati langsung respons output",
          "Arsitektur terisolasi ramah performa tanpa mengunci antarmuka browser",
          "Serial Monitor virtual untuk pemantauan data telemetri dan serial print",
        ],
      },
      {
        id: "problems-debugging",
        icon: AlertTriangle,
        title: "Problems / Debugging",
        badge: "Deterministic Inspection",
        description:
          "Pemeriksaan deterministik terhadap kesalahan umum seperti koneksi pin terbalik, pin menggantung, polaritas salah, hingga kesalahan logika pemrograman.",
        highlights: [
          "Panel Problems dengan penunjuk lokasi error yang spesifik",
          "Pembedaan jelas antara peringatan logika vs kesalahan elektrik fatal",
          "Prinsip belajar dari kesalahan sebagai bagian penting penguasaan materi",
        ],
      },
    ],
  },
  {
    id: "cirra",
    category: "Kecerdasan Buatan Pendamping",
    eyebrow: "03 / Asisten AI Edukatif",
    items: [
      {
        id: "ai-tutor",
        icon: BookOpen,
        title: "AI Tutor",
        badge: "Pedagogical Guide",
        description:
          "Tutor virtual yang siap menerangkan konsep elektronika dasar, arsitektur microcontroller, dan cara kerja sensor dengan bahasa Indonesia yang natural, semi-formal, dan ramah pemula.",
        highlights: [
          "Gaya percakapan suportif berorientasi pemahaman konsep mandiri",
          "Penjelasan kontekstual sesuai tingkat kesulitan materi",
          "Hanya aktif untuk pengguna terdaftar dengan batas kuota proporsional",
        ],
      },
      {
        id: "ai-debugger",
        icon: Bug,
        title: "AI Debugger",
        badge: "Context-Aware Help",
        description:
          "Asisten pemecahan masalah yang membaca ringkasan skema rangkaian, kode, dan log error untuk membimbing langkah perbaikan tanpa langsung membocorkan jawaban utuh.",
        highlights: [
          "Analisis berbasis konteks terstruktur dari panel Problems",
          "Pendekatan bertingkat: petunjuk awal → arahan bertahap",
          "Mengisolasi error tanpa risiko membahayakan komponen fisik nyata",
        ],
      },
      {
        id: "project-assistant",
        icon: Compass,
        title: "Project Assistant",
        badge: "Ideation & Blueprint",
        description:
          "Membantu menerjemahkan ide proyek IoT kamu menjadi cetak biru teknis, daftar kebutuhan komponen, dan rencana implementasi langkah demi langkah.",
        highlights: [
          "Dekomposisi ide menjadi modul input, processing, dan output",
          "Rekomendasi pemilihan sensor dan aktuator yang tepat",
          "Penyusunan target capaian belajar sebelum memulai perakitan",
        ],
      },
    ],
  },
  {
    id: "learning",
    category: "Kurikulum & Perkembangan",
    eyebrow: "04 / Alur Kemampuan",
    items: [
      {
        id: "learning-progress",
        icon: TrendingUp,
        title: "Learning Progress",
        badge: "Skill Tracking",
        description:
          "Pemantauan kemajuan kompetensi modular yang memetakan pemahaman elektronika dasar, wiring, pemrograman microcrontroller, sensor, hingga pengembangan proyek terpadu.",
        highlights: [
          "Progress berdasarkan materi dan challenge yang tersedia",
          "Riwayat penyelesaian materi dan challenge inti",
          "Jembatan konseptual teruji sebelum beralih ke perangkat fisik nyata",
        ],
      },
    ],
  },
];
export function FiturPage() {
  return (
    <PublicMotion route="/fitur">
      <PageHero
        id="fitur-hero-heading"
        eyebrow="Fitur Vircuit"
        title={
          <>
            Dirancang untuk memahami <span className="text-primary">aliran listrik, kode, dan logika.</span>
          </>
        }
        description="Jelajahi 10 fitur utama Vircuit yang memadukan kebebasan merangkai di laboratorium virtual, simulasi interaktif, debugging terarah, dan kecerdasan buatan sebagai pendamping belajar."
        actions={
          <>
            <SimulatorCtaButton />
            <Button asChild variant="outline" className="h-12 px-6">
              <Link href={marketingRoutes.learn}>
                <BookOpen aria-hidden="true" />
                Lihat Alur Belajar
              </Link>
            </Button>
          </>
        }
        aside={<PublicArtwork kind="workspace" id="fitur.hero.art" />}
        note="Simulator edukatif. Periksa dukungan komponen sebelum bereksperimen."
      />

      <FeaturesShowcase />
      {/* Feature groups */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-8 sm:py-16">
        <div className="space-y-16 lg:space-y-24">
          {featureGroups.map((group) => (
            <section data-motion-section={`features.${group.id}`} key={group.id} aria-labelledby={`features-${group.id}-heading`}>
              <div className="border-b pb-4">
                <p data-motion-group={`features.${group.id}.label`} data-motion="identity" className="font-mono text-xs font-medium tracking-widest text-text-secondary uppercase">
                  {group.eyebrow}
                </p>
                <h2 data-motion-group={`features.${group.id}.heading`} data-motion="text" id={`features-${group.id}-heading`} className="mt-2 text-h2 font-semibold tracking-tight">
                  {group.category}
                </h2>
              </div>

              <div className="mt-8 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <article
                      data-motion-card key={item.id}
                      id={item.id}
                      className="flex flex-col justify-between rounded-lg border bg-surface p-6 sm:p-8 transition-colors hover:border-border-strong"
                    >
                      <div>
                        <div data-motion-group={`${item.id}.identity`} data-motion="identity" className="flex items-center justify-between gap-3">
                          <span className="flex size-11 items-center justify-center rounded-md border bg-background text-primary">
                            <Icon className="size-5" aria-hidden="true" />
                          </span>
                          <Badge variant="outline" className="font-mono text-[11px]">
                            {item.badge}
                          </Badge>
                        </div>

                        <h3 data-motion-group={`${item.id}.title`} data-motion="text" className="mt-6 text-xl font-semibold tracking-tight">{item.title}</h3>
                        <p data-motion-group={`${item.id}.description`} data-motion="text" className="mt-3 text-sm leading-relaxed text-text-secondary">{item.description}</p>
                      </div>

                      <div data-motion-group={`${item.id}.details`} data-motion="details" className="mt-6 border-t pt-5">
                        <p className="text-xs font-semibold tracking-wider text-text-secondary uppercase">
                          Kemampuan Utama
                        </p>
                        <ul className="mt-3 space-y-2 text-xs leading-relaxed text-text-secondary">
                          {item.highlights.map((highlight) => (
                            <li key={highlight} className="flex items-start gap-2">
                              <CheckCircle2
                                className="size-3.5 shrink-0 text-primary mt-0.5"
                                aria-hidden="true"
                              />
                              <span>{highlight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>

      <section data-motion-section="features-cirra" className={publicStyles.section}><div className={publicStyles.intro}><p data-motion-group="features-cirra.label" data-motion="identity">Pendamping, bukan pengganti eksperimen</p><h2 data-motion-group="features-cirra.heading" data-motion="text">Cirra membantu menjelaskan konteks.</h2><p data-motion-group="features-cirra.description" data-motion="text">Tutor, Debugger dan Project Assistant tersedia untuk akun login, bergantung kuota dan ketersediaan layanan.</p></div><div data-motion-group="features-cirra.preview" data-motion="art" className="grid gap-4 sm:grid-cols-3">{["Pertanyaan: mengapa LED belum menyala?", "Konteks: wiring, kode dan Problems", "Arahan: periksa pin output dan ground"].map((text) => <p data-part key={text} className="rounded-lg border bg-surface p-6">{text}</p>)}</div><p data-motion-group="features-cirra.note" data-motion="text" className={publicStyles.caption}>Contoh percakapan ilustratif, bukan respons AI langsung.</p></section>
      <CtaSection
        id="fitur-cta-heading"
        eyebrow="Uji Coba Langsung"
        title="Ingin merasakan langsung kanvas Virtual Lab?"
        description="Mulai dari papan microcontroller, hubungkan kabel pertamamu, dan jalankan kode simulasi tanpa perlu membuat akun terlebih dahulu."
        actions={
          <>
            <SimulatorCtaButton label="Buka Simulator Sekarang" />
            <Button asChild variant="outline" className="h-12 px-6">
              <Link href={marketingRoutes.explore}>
                <Layers aria-hidden="true" />
                Lihat Contoh Proyek
              </Link>
            </Button>
          </>
        }
        note="Simulator inti dapat diakses langsung oleh mode tamu."
      />
    </PublicMotion>
  );
}

export default FiturPage;
