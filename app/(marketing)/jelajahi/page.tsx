import { ProjectGallery } from "@/components/marketing/scenes/project-gallery";
import type { ArtworkKind } from "@/components/marketing/scenes/public-artwork";
import { PublicMotion } from "@/components/marketing/scenes/public-motion-page";
import { PublicArtwork } from "@/components/marketing/scenes/public-artwork";
import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpen,
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

export function JelajahiPage() {
  return (
    <PublicMotion route="/jelajahi">
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
        aside={<PublicArtwork kind="traffic-light" id="jelajahi.hero.art" />}
        note="Katalog ini merupakan pratinjau proyek terencana untuk panduan belajar."
      />

      {/* 3 Konsep Eksplorasi */}
      <section data-motion-section="concepts" aria-label="Konsep eksplorasi" className="border-b bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-8 sm:py-16">
          <div className="grid gap-6 md:grid-cols-3">
            {conceptFeatures.map((item) => {
              const Icon = item.icon;
              return (
                <div data-motion-card key={item.title} className="flex flex-col gap-4 items-start"><PublicArtwork kind={item.title === "Project Library" ? "smart-home" : item.title === "Starter Templates" ? "workspace" : "learning"} id={`concept.${item.title}.art`} />
                  <span data-motion-group={`concept.${item.title}.icon`} data-motion="identity" className="flex size-10 shrink-0 items-center justify-center rounded-md border bg-background text-primary">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 data-motion-group={`concept.${item.title}.title`} data-motion="text" className="font-semibold text-base">{item.title}</h3>
                    <p data-motion-group={`concept.${item.title}.description`} data-motion="text" className="mt-1 text-sm leading-relaxed text-text-secondary">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Showcase Capstone: IoT Egg Incubator */}
      <section data-motion-section="capstone" aria-labelledby="capstone-heading" className="mx-auto max-w-7xl px-4 py-16 sm:px-8">
        <div className="relative overflow-hidden rounded-xl border bg-surface p-6 sm:p-10 lg:p-12">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <div data-motion-group="capstone.badges" data-motion="identity" className="flex flex-wrap items-center gap-2">
                <Badge variant="default" className="font-mono text-xs">
                  Capstone Project
                </Badge>
                <Badge variant="outline" className="font-mono text-xs">
                  Advanced Tier
                </Badge>
              </div>

              <h2 data-motion-group="capstone.title" data-motion="text" id="capstone-heading" className="mt-4 text-h2 font-semibold tracking-tight">
                IoT Egg Incubator
              </h2>
              <p data-motion-group="capstone.description" data-motion="text" className="mt-4 text-base leading-relaxed text-text-secondary">
                Konsep proyek capstone yang menggabungkan pembacaan sensor suhu dan kelembapan,
                logika kontrol histeresis, indikator layar display, relay pemanas, dan kipas sirkulasi otomatis dalam satu sistem terpadu.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 border-t pt-6 text-xs text-text-secondary">
                <div data-motion-group="capstone.board" data-motion="details">
                  <span className="font-mono block text-foreground font-semibold">Microcontroller</span>
                  ESP32 · konsep integrasi
                </div>
                <div data-motion-group="capstone.sensor" data-motion="details">
                  <span className="font-mono block text-foreground font-semibold">Sensor Input</span>
                  DHT22 Suhu & Kelembapan
                </div>
                <div data-motion-group="capstone.output" data-motion="details">
                  <span className="font-mono block text-foreground font-semibold">Aktuator & Output</span>
                  Relay, Kipas, Heater & LCD
                </div>
              </div>
            </div>

            <div className="flex justify-center lg:col-span-5">
              <PublicArtwork kind="iot-egg-incubator" id="capstone.art" caption="Diagram konsep capstone · bukan template executable" />
            </div>
          </div>
        </div>
      </section>

      <ProjectGallery>
      {/* Katalog Proyek Berdasarkan Level */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-8 sm:py-16">
        <div className="space-y-16">
          {projectLevels.map((lvl) => {
            const projectsInLevel = projectCatalog.filter((p) => p.level === lvl.level);

            return (
              <section data-motion-section={`level.${lvl.level}`} data-level={lvl.level} key={lvl.level} aria-labelledby={`level-${lvl.level}`}>
                <div className="border-b pb-4">
                  <div data-motion-group={`level.${lvl.level}.title`} data-motion="identity" className="flex items-center gap-3">
                    <h2 id={`level-${lvl.level}`} className="text-h3 font-semibold tracking-tight">
                      Level {lvl.level}
                    </h2>
                    <Badge variant="outline" className="font-mono text-xs">
                      {lvl.label}
                    </Badge>
                  </div>
                  <p data-motion-group={`level.${lvl.level}.description`} data-motion="text" className="mt-1 text-sm text-text-secondary">{lvl.description}</p>
                </div>

                <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {projectsInLevel.map((item) => {
                    const Icon = item.icon;
                    return (
                      <article
                        data-motion-card data-project={item.slug} key={item.slug}
                        className="flex flex-col justify-between rounded-lg border bg-surface p-6 transition-colors hover:border-border-strong"
                      >
                        <PublicArtwork kind={item.slug as ArtworkKind} id={`project.${item.slug}.art`} />
                        <div>
                          <div data-motion-group={`project.${item.slug}.identity`} data-motion="identity" className="flex items-center justify-between gap-3">
                            <span className="flex size-11 items-center justify-center rounded-md border bg-background text-primary">
                              <Icon className="size-5" aria-hidden="true" />
                            </span>
                            <span className="font-mono text-xs text-text-secondary">{item.topic}</span>
                          </div>

                          <h3 data-motion-group={`project.${item.slug}.title`} data-motion="text" className="mt-5 text-lg font-semibold tracking-tight">{item.name}</h3>
                          <p data-motion-group={`project.${item.slug}.description`} data-motion="text" className="mt-2 text-sm leading-relaxed text-text-secondary">{item.text}</p>
                        </div>

                        <div data-motion-group={`project.${item.slug}.concepts`} data-motion="details" className="mt-6 border-t pt-4">
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
                        <div data-motion-group={`project.${item.slug}.action`} data-motion="actions" className="mt-6"><p className="mb-2 text-xs text-text-secondary">{item.slug === "traffic-light" ? "Materi tersedia" : "Pratinjau konsep"}</p><Button variant="outline" className="w-full min-h-11" data-project-detail={item.slug}>Lihat detail {item.name}</Button></div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      </ProjectGallery>
      <CtaSection
        id="jelajahi-cta-heading"
        eyebrow="Eksplorasi Bebas"
        title="Punya ide rangkaian buatan sendiri?"
        description="Buka Virtual Lab dan lanjutkan eksperimenmu. Draft yang sudah ada tetap dipertahankan."
        actions={
          <>
            <SimulatorCtaButton label="Buka Virtual Lab" />
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
    </PublicMotion>
  );
}

export default JelajahiPage;
