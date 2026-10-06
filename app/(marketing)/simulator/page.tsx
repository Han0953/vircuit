import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Boxes,
  Code2,
  Cpu,
  Info,
  Layers,
  Play,
  Workflow,
} from "lucide-react";
import { marketingRoutes } from "@/components/marketing/marketing-routes";
import { PageHero } from "@/components/marketing/page-hero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Simulator",
  description:
    "Entry point Virtual Lab Vircuit: ruang eksperimen rangkaian, wiring interaktif, dan simulasi kode IoT.",
};

const workspaceModules = [
  {
    icon: Boxes,
    name: "Katalog Komponen (Parts)",
    desc: "Arduino Uno, Arduino Nano, ESP32, breadboard, sensor suhu, LED, dan aktuator.",
    status: "Milestone 2 (VIR-042)",
  },
  {
    icon: Cpu,
    name: "Kanvas Sirkuit Bebas",
    desc: "Penempatan komponen bebas dengan drag-and-drop, zoom, pan, dan seleksi fleksibel.",
    status: "Milestone 2 (VIR-040)",
  },
  {
    icon: Workflow,
    name: "Mesin Wiring Interaktif",
    desc: "Koneksi pin-to-pin logis, jalur internal breadboard, dan penataan warna kabel.",
    status: "Milestone 3 (VIR-060)",
  },
  {
    icon: Code2,
    name: "Editor Kode & Serial Monitor",
    desc: "Penulisan program C/C++, sintaksis Arduino standar, dan telemetri serial monitor.",
    status: "Milestone 4 (VIR-080)",
  },
  {
    icon: Play,
    name: "Simulation Runtime",
    desc: "Evaluasi logis rangkaian dan respons sensor terhadap instruksi kode.",
    status: "Milestone 5 (VIR-100)",
  },
];

export function SimulatorPage() {
  return (
    <>
      <PageHero
        id="simulator-entry-heading"
        eyebrow="Entry Point Virtual Lab"
        title={
          <>
            Ruang Eksperimen <span className="text-primary">Virtual Lab Vircuit.</span>
          </>
        }
        description="Pintu masuk resmi untuk memulai simulasi sirkuit IoT. Modul kanvas interaktif React Flow, wiring engine, dan editor kode sedang dipersiapkan pada tahap implementasi berikutnya sesuai urutan roadmap PRD."
        actions={
          <>
            <Button asChild className="h-12 px-6">
              <Link href={marketingRoutes.features}>
                Pelajari Fitur Simulator<ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-12 px-6">
              <Link href={marketingRoutes.explore}>
                <Layers aria-hidden="true" />
                Lihat Katalog Proyek
              </Link>
            </Button>
          </>
        }
        note="Entry point route /simulator telah aktif dan terhubung ke seluruh sistem navigasi."
      />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-8 sm:py-16">
        {/* Development Status Banner */}
        <div className="rounded-xl border border-primary/30 bg-primary-soft/30 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Info className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold tracking-tight">Status Pengembangan Workspace</h2>
                <Badge variant="outline" className="font-mono text-xs">
                  Roadmap Milestone 2
                </Badge>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                Sesuai batasan task arsitektur public website, halaman ini berfungsi sebagai entry point route resmi tanpa menginisialisasi
                library simulator berat seperti React Flow atau Web Worker runtime. Komponen workspace lengkap akan dihubungkan saat task VIR-040 dieksekusi.
              </p>
            </div>
          </div>
        </div>

        {/* Planned Workspace Modules */}
        <section aria-labelledby="modules-heading" className="mt-12">
          <div className="border-b pb-4">
            <p className="font-mono text-xs font-medium tracking-widest text-text-secondary uppercase">
              Arsitektur Shell
            </p>
            <h2 id="modules-heading" className="mt-2 text-h2 font-semibold tracking-tight">
              Modul yang Akan Tersedia di Workspace
            </h2>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {workspaceModules.map((mod) => {
              const Icon = mod.icon;
              return (
                <div
                  key={mod.name}
                  className="flex flex-col justify-between rounded-lg border bg-surface p-6"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="flex size-10 items-center justify-center rounded-md border bg-background text-primary">
                        <Icon className="size-5" aria-hidden="true" />
                      </span>
                      <Badge variant="secondary" className="font-mono text-[11px]">
                        {mod.status}
                      </Badge>
                    </div>
                    <h3 className="mt-4 font-semibold text-base">{mod.name}</h3>
                    <p className="mt-2 text-xs leading-relaxed text-text-secondary">{mod.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Back navigation */}
        <div className="mt-16 border-t pt-8 text-center sm:text-left">
          <Button asChild variant="ghost">
            <Link href={marketingRoutes.home} className="inline-flex items-center gap-2">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Kembali ke Beranda Vircuit
            </Link>
          </Button>
        </div>
      </div>
    </>
  );
}

export default SimulatorPage;
