"use client";
import { useId, useState } from "react";
import { CircuitBoard, Cpu, Gauge, Layers3, Monitor, Search, SearchX, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { catalog } from "../../catalog/registry";
import { useProject } from "../../stores/project-store";
import { useCanvas } from "../../stores/canvas-store";
import { ComponentThumbnail } from "../visuals/component-thumbnail";
import styles from "../workspace/workspace-controls.module.css";
const categories = [{ name: "Boards", icon: Cpu }, { name: "Breadboards", icon: Layers3 }, { name: "Basic", icon: CircuitBoard },
  { name: "Sensors", icon: Gauge }, { name: "Actuators", icon: Zap }, { name: "Displays", icon: Monitor }];
export function PartsPanel({ category, onCategoryChange }: { category: string; onCategoryChange: (category: string) => void }) {
  const [query, setQuery] = useState("");
  const [dragging, setDragging] = useState<string | null>(null);
  const descriptionId = useId();
  const selection = useCanvas((s) => s.selection);
  const selectedType = useProject((s) => s.project.components.find((c) => selection.includes(c.id))?.type);
  const atLimit = useProject((s) => s.project.components.length >= 100);
  const term = query.trim().toLowerCase();
  const visible = catalog.filter((c) => term ? `${c.name} ${c.key} ${c.category}`.toLowerCase().includes(term) : c.category === category);
  return <div className={styles.parts}>
    <div className={styles.search}><Search aria-hidden="true" /><Input aria-label="Cari komponen" placeholder="Cari komponen" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
    <div className={styles.categories} aria-label="Kategori Parts">{categories.map(({ name, icon: Icon }) => <Button key={name} variant="ghost" className={styles.category} onClick={() => onCategoryChange(name)} aria-pressed={category === name}><Icon aria-hidden="true" />{name}</Button>)}</div>
    <p className="text-xs leading-relaxed text-text-secondary">Klik untuk menambah, atau seret ke canvas.</p>
    <p role="status" className="mt-1 text-xs text-text-secondary">{atLimit ? "Batas 100 komponen tercapai." : `${visible.length} komponen · ${term ? "semua kategori" : category}`}</p>
    <div className={styles.library}>{visible.map((c) => <button key={c.key} type="button" className={styles.tile} aria-label={c.name}
      aria-describedby={`${descriptionId}-${c.key}`} title={`Tambahkan ${c.name}${c.supportNote ? ` · ${c.supportNote}` : ""}`} disabled={atLimit} data-component-type={c.key} data-selected={selectedType === c.key} data-dragging={dragging === c.key}
      draggable={!atLimit} onDragStart={(e) => { setDragging(c.key); e.dataTransfer.setData("application/vircuit-component", c.key); e.dataTransfer.effectAllowed = "copy"; }} onDragEnd={() => setDragging(null)}
      onClick={() => {
        const p = useProject.getState().project, v = p.viewport;
        useProject.getState().add(c.key, { x: (40 - v.x) / v.zoom + (p.components.length % 4) * 35, y: (60 - v.y) / v.zoom + (p.components.length % 4) * 35 });
        const id = useProject.getState().project.components.at(-1)?.id;
        if (id) useCanvas.getState().select([id]);
      }}>
      <span className={`component-art ${styles.preview}`} data-testid="part-thumbnail"><ComponentThumbnail definition={c} /></span>
      <span className={styles.tileName}>{c.name}</span>
      <span id={`${descriptionId}-${c.key}`} className={styles.tileMeta}><span>{c.category}</span><span className={styles.support}>{c.support === "visual-only" ? "Visual saja" : "Subset edukatif"}</span>{c.supportNote && <span className="sr-only">{c.supportNote}</span>}</span>
    </button>)}</div>
    {!visible.length && <div className={styles.empty}><SearchX aria-hidden="true" /><p>{term ? "Tidak ada komponen yang cocok." : "Belum ada komponen dalam kategori ini."}</p>{term && <Button variant="outline" onClick={() => setQuery("")}>Bersihkan pencarian</Button>}</div>}
  </div>;
}
