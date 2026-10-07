"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FolderOpen, LogOut, Plus, Save, Trash2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { serializeProject } from "@/features/simulator/schemas/project-schema";
import { useProject } from "@/features/simulator/stores/project-store";
import { usePersistence } from "../store";
import { deleteCloudProject, listCloudProjects, newProject, openCloudProject, requestSave, saveAsNew, saveToCloud } from "../cloud/client";
import { logout } from "../session";
import { titleSchema } from "../contracts";
import { archivedDrafts, type Draft } from "../local/drafts";
import { replaceDraft } from "../local/controller";

function exportBackup() {
  const url = URL.createObjectURL(new Blob([serializeProject(useProject.getState().project)], { type: "application/json" }));
  const link = document.createElement("a"); link.href = url; link.download = "vircuit-backup.json"; link.click(); URL.revokeObjectURL(url);
}
export function ProjectControls() {
  const router = useRouter();
  const userId = usePersistence((s) => s.userId);
  const busy = usePersistence((s) => s.busy);
  const status = usePersistence((s) => s.status);
  const error = usePersistence((s) => s.error);
  const name = useProject((s) => s.project.metadata.name);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(name);
  const [projects, setProjects] = useState<Awaited<ReturnType<typeof listCloudProjects>>>([]);
  const [archives, setArchives] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  async function action(fn: () => Promise<unknown>) {
    setMessage(""); setLoading(true);
    try { await fn(); } catch (error) {
      const text = error instanceof Error ? error.message : "Permintaan gagal.";
      setMessage(text); usePersistence.setState({ error: text });
    } finally { setLoading(false); }
  }
  async function showProjects() {
    setOpen(true); setTitle(name);
    await action(async () => {
      const scope = usePersistence.getState().draft?.scope;
      setArchives(scope ? await archivedDrafts(scope) : []);
      if (userId) setProjects(await listCloudProjects());
    });
  }
  const statusLabel = { unsaved: "Belum tersimpan di akun", saving: "Menyimpan…", saved: "Tersimpan di akun", failed: "Simpan gagal" }[status];
  return <>
    <span role="status" className="max-w-36 truncate text-xs text-text-secondary" title={statusLabel}>{statusLabel}</span>
    <Button disabled={busy || loading} variant="ghost" aria-label={status === "failed" ? "Coba simpan lagi" : "Simpan proyek"} onClick={() => void action(async () => { const next = await requestSave(); if (next) router.push(next); })} className="px-3"><Save aria-hidden /><span className="hidden sm:inline">Simpan</span></Button>
    <Button disabled={busy || loading} variant="ghost" size="icon" aria-label="Buka menu proyek" onClick={() => void showProjects()}><FolderOpen aria-hidden /></Button>
    {userId && <Button disabled={busy || loading} variant="ghost" size="icon" aria-label="Keluar akun" onClick={() => void action(async () => {
      const draft = usePersistence.getState().draft;
      if (draft && (await archivedDrafts(draft.scope)).length && !window.confirm("Ada arsip draft lokal akun. Ekspor arsip yang diperlukan melalui menu Proyek sebelum keluar. Lanjut keluar dan hapus cache akun termasuk arsip?")) return;
      if (draft && draft.savedLocalRevision !== draft.localRevision) {
        if (!window.confirm("Perubahan belum tersimpan di cloud. Unduh cadangan JSON sebelum keluar? Cache akun di browser akan dibersihkan.")) return;
        exportBackup();
      }
      await logout(); setProjects([]);
    })}><LogOut aria-hidden /></Button>}
    {(error || message) && <span role="alert" className="max-w-full text-xs text-destructive">{error || message}</span>}
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader><DialogTitle>Proyek</DialogTitle><DialogDescription>Kelola proyek aktif dan buka rangkaian milik akunmu.</DialogDescription></DialogHeader>
        <form className="space-y-3" onSubmit={(event) => {
          event.preventDefault();
          const parsed = titleSchema.safeParse(title);
          if (!parsed.success) { setMessage("Judul harus berisi 1–200 karakter."); return; }
          void action(async () => {
            useProject.getState().edit((p) => ({ ...p, metadata: { name: parsed.data } }));
            if (usePersistence.getState().draft?.cloud) { await saveToCloud(); if (usePersistence.getState().status === "unsaved") await saveToCloud(); }
            setOpen(false);
          });
        }}>
          <label htmlFor="project-title" className="text-sm font-medium">Nama proyek aktif</label>
          <Input id="project-title" value={title} maxLength={200} onChange={(event) => setTitle(event.target.value)} disabled={busy || loading} />
          <Button type="submit" variant="outline" disabled={busy || loading}>Ganti nama</Button>
        </form>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={busy || loading} onClick={() => void action(async () => { await newProject(); setOpen(false); })}><Plus aria-hidden />Proyek baru</Button>
          <Button variant="outline" onClick={exportBackup}><Download aria-hidden />Ekspor cadangan</Button>
          {userId && <Button variant="outline" disabled={busy || loading} onClick={() => void action(async () => { await saveAsNew(); setOpen(false); })}>Simpan sebagai proyek baru</Button>}
        </div>
        {!!archives.length && <section aria-label="Arsip draft lokal" className="space-y-2 border-t pt-3"><h2 className="text-sm font-semibold">Arsip draft lokal</h2><p className="text-xs text-text-secondary">Perubahan yang belum disimpan tetap diarsipkan ketika berganti proyek.</p>{archives.map((item) => <div key={item.scope} className="flex items-center gap-2 rounded-md border p-2"><p className="min-w-0 flex-1 truncate text-sm">{item.project.metadata.name}</p><Button variant="outline" disabled={busy || loading} onClick={() => void action(async () => {
          const scope = usePersistence.getState().draft?.scope;
          if (scope) await replaceDraft({ ...item, scope });
          setOpen(false);
        })}>Pulihkan</Button></div>)}</section>}
        {message && <p role="alert" className="text-sm text-destructive">{message}</p>}
        {userId ? <section aria-label="Proyek akun" className="space-y-3 border-t pt-4">
          <div className="flex items-center justify-between"><h2 className="text-sm font-semibold">Proyek tersimpan</h2><Button variant="ghost" disabled={loading || busy} onClick={() => void action(async () => { setProjects(await listCloudProjects()); })}>Muat ulang</Button></div>
          {loading ? <p role="status" className="text-sm">Memuat…</p> : !projects.length && <p className="text-sm text-text-secondary">Belum ada proyek tersimpan.</p>}
          {projects.map((project) => <div key={project.id} className="flex items-center gap-2 rounded-md border p-3"><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{project.title}</p><p className="text-xs text-text-secondary">Revision {project.revision}</p></div>
            <Button variant="outline" disabled={busy || loading} onClick={() => void action(async () => { await openCloudProject(project.id); setOpen(false); })}>Buka</Button>
            <Button variant="ghost" size="icon" disabled={busy || loading} aria-label={`Hapus ${project.title}`} onClick={() => { if (window.confirm(`Hapus proyek “${project.title}” dari akun?`)) void action(async () => { await deleteCloudProject(project.id, project.revision); setProjects(await listCloudProjects()); }); }}><Trash2 aria-hidden /></Button></div>)}
        </section> : <p className="text-sm text-text-secondary">Pilih Simpan untuk masuk dan memindahkan draft ini ke akun.</p>}
      </DialogContent>
    </Dialog>
  </>;
}
