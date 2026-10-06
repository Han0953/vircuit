import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpen,
  Egg,
  FolderKanban,
  Sparkles,
  Target,
  Terminal,
} from "lucide-react";
import { CtaSection, SimulatorCtaButton } from "@/components/marketing/final-cta-section";
import { marketingRoutes } from "@/components/marketing/marketing-routes";
import { PageHero } from "@/components/marketing/page-hero";
import {
  projectCatalog,
  projectLevels,
} from "@/components/marketing/project-catalog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Jelajahi",
  description:
    "Jelajahi katalog proyek IoT, template sirkuit, dan challenge di Vircuit: dari Traffic Light, Smart Lamp, hingga proyek capstone IoT Egg Incubator.",
};

/**
 * Three core exploration concepts planned for Vircuit (PRD Section 6.6 & 6.10):
 * - Project Library: Ready-to-study modular schematics
 * - Starter Templates: Pre-wired base circuits to jumpstart experimentation
 * - Interactive Challenges: Problem-based circuit & code tasks
 */
const conceptFeatures = [
  {
    icon: FolderKanban,
    title: "Project Library",
    description:
      "Perpustakaan skema rangkaian modular yang mencakup berbagai sensor dan aktuator standar untuk referensi belajar mandiri.",
  },
  {
    icon: Terminal,
    title: "Starter Templates",
    description:
      "Titik awal siap pakai dengan wiring dasar dan skeleton kode terpasang, menghemat waktu setup sehingga kamu bisa langsung bereksperimen.",
  },
  {
    icon: Target,
    title: "Interactive Challenges",
    description:
      "Tantangan dengan kriteria kondisi tertentu—seperti memperbaiki kabel putus atau memprogram timer—untuk menguji pemahaman.",
  },
];

/**
 * Public Explore Page (Route: `/jelajahi`).
 *
 * Showcases educational circuit templates and challenges across Beginner, Intermediate,
 * and Advanced tiers, highlighted by the flagship IoT Egg Incubator capstone project.
 * Implemented strictly as presentation-layer preview cards without premature backend coupling.
 */
export function JelajahiPage() {
  return (
    <>
      <PageHero
        id="jelajahi-hero-heading"
        eyebrow="Jelajahi Vircuit"
        title={
          <>
            Katalog Proyek & <span className="text-primary">Eksplorasi Praktik IoT.</span>
          </>
        }
        description="Temukan ragam proyek terstruktur dari tingkat dasar, menengah, hingga sistem otomasi lanjutan. Gunakan sebagai inspirasi belajar dan acuan eksplorasi di Virtual Lab."
        actions={
          <>
            <SimulatorCtaButton />
            <Button asChild variant="outline" className="h-12 px-6">
              <Link href={marketingRoutes.learn}>
                <BookOpen aria-hidden="true" />
                Pelajari Alur Belajar
              </Link>
            </Button>
          </>
        }
        note="Katalog ini merupakan pratinjau proyek terencana untuk panduan belajar."
      />

      {/* 3 Konsep Eksplorasi */}
      <section aria-labelledby="concepts-heading" className="border-b bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-8 sm:py-16">
          <div className="grid gap-6 md:grid-cols-3">
            {conceptFeatures.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex gap-4 items-start">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-md border bg-background text-primary">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="font-semibold text-base">{item.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-text-secondary">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Showcase Capstone: IoT Egg Incubator */}
      <section aria-labelledby="capstone-heading" className="mx-auto max-w-7xl px-4 py-16 sm:px-8">
        <div className="relative overflow-hidden rounded-xl border bg-surface p-6 sm:p-10 lg:p-12">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="default" className="font-mono text-xs">
                  Capstone Project
                </Badge>
                <Badge variant="outline" className="font-mono text-xs">
                  Advanced Tier
                </Badge>
              </div>

              <h2 id="capstone-heading" className="mt-4 text-h2 font-semibold tracking-tight">
                IoT Egg Incubator
              </h2>
              <p className="mt-4 text-base leading-relaxed text-text-secondary">
                Proyek unggulan Vircuit yang menggabungkan pembacaan sensor suhu dan kelembapan,
                logika kontrol histeresis, indikator layar display, relay pemanas, dan kipas sirkulasi otomatis dalam satu sistem terpadu.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 border-t pt-6 text-xs text-text-secondary">
                <div>
                  <span className="font-mono block text-foreground font-semibold">Microcontroller</span>
                  ESP32 30-Pin NodeMCU
                </div>
                <div>
                  <span className="font-mono block text-foreground font-semibold">Sensor Input</span>
                  DHT22 Suhu & Kelembapan
                </div>
                <div>
                  <span className="font-mono block text-foreground font-semibold">Aktuator & Output</span>
                  Relay, Kipas, Heater & LCD
                </div>
              </div>
            </div>

            <div className="flex justify-center lg:col-span-5">
              <div className="flex size-44 sm:size-56 items-center justify-center rounded-2xl border border-dashed bg-background">
                <Egg className="size-24 sm:size-28 text-primary" strokeWidth={1.25} aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Katalog Proyek Berdasarkan Level */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-8 sm:py-16">
        <div className="space-y-16">
          {projectLevels.map((lvl) => {
            const projectsInLevel = projectCatalog.filter((p) => p.level === lvl.level);

            return (
              <section key={lvl.level} aria-labelledby={`level-${lvl.level}`}>
                <div className="border-b pb-4">
                  <div className="flex items-center gap-3">
                    <h2 id={`level-${lvl.level}`} className="text-h3 font-semibold tracking-tight">
                      Level {lvl.level}
                    </h2>
                    <Badge variant="outline" className="font-mono text-xs">
                      {lvl.label}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-text-secondary">{lvl.description}</p>
                </div>

                <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {projectsInLevel.map((item) => {
                    const Icon = item.icon;
                    return (
                      <article
                        key={item.slug}
                        className="flex flex-col justify-between rounded-lg border bg-surface p-6 transition-colors hover:border-border-strong"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-3">
                            <span className="flex size-11 items-center justify-center rounded-md border bg-background text-primary">
                              <Icon className="size-5" aria-hidden="true" />
                            </span>
                            <span className="font-mono text-xs text-text-secondary">{item.topic}</span>
                          </div>

                          <h3 className="mt-5 text-lg font-semibold tracking-tight">{item.name}</h3>
                          <p className="mt-2 text-sm leading-relaxed text-text-secondary">{item.text}</p>
                        </div>

                        <div className="mt-6 border-t pt-4">
                          <p className="text-[11px] font-mono uppercase text-text-secondary">
                            Konsep Kunci:
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {item.concepts.map((concept) => (
                              <Badge key={concept} variant="secondary" className="text-[11px] font-normal">
                                {concept}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <CtaSection
        id="jelajahi-cta-heading"
        eyebrow="Eksplorasi Bebas"
        title="Punya ide rangkaian buatan sendiri?"
        description="Buka workspace kosong dan mulailah menyusun komponen secara bebas tanpa batasan template."
        actions={
          <>
            <SimulatorCtaButton label="Mulai Proyek Kosong" />
            <Button asChild variant="outline" className="h-12 px-6">
              <Link href={marketingRoutes.pricing}>
                <Sparkles aria-hidden="true" />
                Lihat Paket Akses
              </Link>
            </Button>
          </>
        }
        note="Proyek dapat disimpan setelah kamu mendaftar atau masuk."
      />
    </>
  );
}

export default JelajahiPage;
