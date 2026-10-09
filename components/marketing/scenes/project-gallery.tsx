"use client";
import { useState, type ReactNode } from "react";
import Link from "next/link";
import { projectCatalog, type ProjectLevel } from "../project-catalog";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader } from "@/components/ui/dialog";
import { PublicArtwork, type ArtworkKind } from "./public-artwork";
import styles from "../public-pages.module.css";
import { PublicMotion } from "./public-motion-page";
export function ProjectGallery({ children }: { children: ReactNode }) {
  const [level, setLevel] = useState<ProjectLevel | "All">("All");
  const [selected, setSelected] = useState<string | null>(null);
  const [lastTrigger, setLastTrigger] = useState<string | null>(null);
  const project = projectCatalog.find((item) => item.slug === selected);
  const visibleCount = projectCatalog.filter((item) => level === "All" || item.level === level).length;
  const levelLabel = { All: "semua tingkat", Beginner: "dasar", Intermediate: "menengah", Advanced: "lanjutan" }[level];
  return <div data-gallery-filter={level}>
    <div className={styles.section} style={{ paddingBottom: 0 }}>
      <div className={styles.filters} data-motion-group="gallery.filters" data-motion="control" aria-label="Filter tingkat proyek">{([ ["All", "Semua"], ["Beginner", "Dasar"], ["Intermediate", "Menengah"], ["Advanced", "Lanjutan"] ] as const).map(([value, label]) => <button key={value} aria-pressed={level === value} onClick={() => setLevel(value)}>{label}</button>)}</div>
      <p data-motion-group="gallery.status" data-motion="text" role="status" className="text-sm text-text-secondary">{visibleCount} proyek · {levelLabel}</p>
    </div>
    <div onClick={(event) => { const target = event.target instanceof Element ? event.target.closest<HTMLButtonElement>("[data-project-detail]") : null; if (target) { setLastTrigger(target.dataset.projectDetail ?? null); setSelected(target.dataset.projectDetail ?? null); } }}>{children}</div>
    <Dialog open={!!project} onOpenChange={(open) => { if (!open) setSelected(null); }}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto" onCloseAutoFocus={(event) => { event.preventDefault(); document.querySelector<HTMLButtonElement>(`[data-project-detail='${lastTrigger}']`)?.focus(); }}>
        {project && <PublicMotion route="project-detail"><DialogHeader><DialogTitle data-motion-group="gallery.detail.title" data-motion="text">{project.name}</DialogTitle><DialogDescription data-motion-group="gallery.detail.description" data-motion="text">{project.text}</DialogDescription></DialogHeader><PublicArtwork kind={project.slug as ArtworkKind} id="gallery.detail.art" /><p data-motion-group="gallery.detail.concepts" data-motion="details" className="my-4 text-sm text-text-secondary">{project.concepts.join(" · ")}</p><p data-motion-group="gallery.detail.status" data-motion="text" className="text-sm">{project.slug === "traffic-light" ? "Materi Traffic Light tersedia dalam course dasar Arduino Uno." : "Pratinjau konsep. Belum tersedia sebagai template siap dijalankan."}</p><Link data-motion-group="gallery.detail.action" data-motion="actions" className="inline-flex min-h-11 items-center font-semibold text-primary" href={project.slug === "traffic-light" ? "/dashboard/learn/dasar-iot/traffic-light" : "/simulator"}>{project.slug === "traffic-light" ? "Buka materi Traffic Light" : "Eksperimen di Virtual Lab"}</Link></PublicMotion>}
      </DialogContent>
    </Dialog>
  </div>;
}
