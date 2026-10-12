"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CircuitBoard, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { OptionPicker } from "@/components/shared/option-picker";
import { usePersistence } from "@/features/projects/store";
import { useProject } from "../../stores/project-store";
import { codeExamples, type ExampleId } from "../../runtime/templates";
import { exampleProject } from "../../examples/projects";
import { applyExample } from "../../examples/apply-example";
import { CircuitThumbnail } from "../visuals/circuit-thumbnail";
import styles from "../workspace/workspace-controls.module.css";

export function ExampleLibrary({ initialId = "blink", compact = false, label = "Contoh rangkaian" }: { initialId?: ExampleId; compact?: boolean; label?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false), [selected, setSelected] = useState<ExampleId>(initialId);
  const [esp32, setEsp32] = useState(false), [includeCircuit, setIncludeCircuit] = useState(true);
  const [pending, setPending] = useState(false), [error, setError] = useState("");
  const ready = usePersistence((s) => s.ready && !s.busy && !s.handoffBusy);
  const projects = useMemo(() => open ? new Map(codeExamples.map((item) => [item.id, exampleProject(item.id, esp32)])) : new Map<ExampleId, ReturnType<typeof exampleProject>>(), [open, esp32]);
  const example = codeExamples.find((item) => item.id === selected)!;
  const activeEsp32 = () => useProject.getState().project.components.find((c) => c.id === useProject.getState().project.settings.boardId)?.type === "esp32";
  async function apply() {
    setPending(true); setError("");
    try {
      const area = document.querySelector(".react-flow")?.getBoundingClientRect();
      await applyExample(selected, esp32, includeCircuit, area);
      setOpen(false);
      if (includeCircuit) router.push("/simulator");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Contoh gagal dibuka."); }
    finally { setPending(false); }
  }
  return <>
    <Button variant="outline" size={compact ? "icon" : "default"} aria-label={label} title={label} onClick={() => { setSelected(initialId); setEsp32(activeEsp32()); setError(""); setIncludeCircuit(true); setOpen(true); }}><CircuitBoard aria-hidden />{!compact && label}</Button>
    <Dialog open={open} onOpenChange={(value) => { if (!pending) setOpen(value); }}>
      <DialogContent className="flex max-h-[92dvh] w-[calc(100vw-24px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl" onEscapeKeyDown={(event) => { if (pending) event.preventDefault(); }} onPointerDownOutside={(event) => { if (pending) event.preventDefault(); }}>
        <DialogHeader className="shrink-0 border-b p-5 pr-12"><DialogTitle>Contoh kode & rangkaian</DialogTitle><DialogDescription>Pilih dari 12 contoh yang dapat dijalankan. Gambar memakai komponen dan koneksi rangkaian aktual.</DialogDescription></DialogHeader>
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b px-5 py-3"><p className="text-xs text-text-secondary">Arduino C/C++ subset · API virtual Vircuit</p><OptionPicker label="Board contoh" value={esp32 ? "esp32" : "uno"} disabled={pending || !includeCircuit} onChange={(value) => setEsp32(value === "esp32")} options={[{ value: "uno", label: "Arduino Uno R3", icon: <Cpu aria-hidden /> }, { value: "esp32", label: "ESP32 DevKitC V4", icon: <Cpu aria-hidden /> }]} /></div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4"><div className={styles.exampleGrid}>{codeExamples.map((item) => <button key={item.id} type="button" aria-label={`Pilih ${item.title}`} aria-pressed={selected === item.id} disabled={pending} className={styles.exampleCard} onClick={() => setSelected(item.id)}>
          <span className={styles.exampleArt}>{projects.get(item.id) && <CircuitThumbnail project={projects.get(item.id)!} title={item.title} />}</span>
          <span className="flex items-center justify-between gap-2"><span className="text-sm font-semibold">{item.title}</span>{selected === item.id && <Check aria-hidden className="size-4 shrink-0 text-primary" />}</span>
          <span className="text-[10px] uppercase tracking-wide text-primary">{item.topic}</span><span className="text-xs leading-relaxed text-text-secondary">{item.description}</span>
        </button>)}</div></div>
        <div className="shrink-0 space-y-3 border-t bg-surface p-4">
          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium"><input type="checkbox" checked={includeCircuit} disabled={pending} className="size-4 accent-primary focus-visible:outline-2 focus-visible:outline-ring" onChange={(event) => { setIncludeCircuit(event.target.checked); if (!event.target.checked) setEsp32(activeEsp32()); }} />Gunakan rangkaian contoh juga</label>
          <p className="text-xs leading-relaxed text-text-secondary">{includeCircuit ? "Rangkaian dan kode dibuka sebagai draft lokal baru. Proyek aktif diarsipkan di menu Proyek; proyek cloud tidak ditimpa." : "Hanya kode aktif yang diganti sesuai board saat ini. Rangkaian tetap dipertahankan; gunakan Undo untuk mengembalikan kode."}</p>
          {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
          <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-medium">{example.title}</p><Button disabled={pending || !ready} onClick={() => void apply()}>{pending ? "Membuka…" : includeCircuit ? "Buka sebagai draft baru" : "Gunakan kode saja"}</Button></div>
        </div>
      </DialogContent>
    </Dialog>
  </>;
}
