"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { archivedDrafts, deleteDraft, readDraft, type Draft } from "@/features/projects/local/drafts";
import { clearPreferences } from "../preferences";
import { DeleteAccount } from "./delete-account";
import { Feedback, SettingGroup, SettingsSection, SettingsDialogContent } from "./setting-controls";

export function DataSettings({ owner, hasPassword, anyDirty }: { owner: string; hasPassword: boolean; anyDirty: boolean }) {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [confirmation, setConfirmation] = useState<Draft | "preferences" | null>(null);
  const [feedback, setFeedback] = useState({ message: "", error: false });
  async function load() {
    setLoading(true);
    try {
      const scope = `user:${owner}`;
      const [active, archives, guest] = await Promise.all([readDraft(scope), archivedDrafts(scope), readDraft("guest")]);
      setDrafts([...(active ? [active] : []), ...archives, ...(guest ? [guest] : [])]);
    } catch { setFeedback({ message: "Draft lokal belum dapat dibaca. Periksa izin penyimpanan lalu coba lagi.", error: true }); }
    finally { setLoading(false); }
  }
  useEffect(() => { let alive = true; const scope = `user:${owner}`;
    void Promise.all([readDraft(scope), archivedDrafts(scope), readDraft("guest")]).then(([active, archives, guest]) => { if (alive) setDrafts([...(active ? [active] : []), ...archives, ...(guest ? [guest] : [])]); }).catch(() => { if (alive) setFeedback({ message: "Draft lokal belum dapat dibaca. Coba lagi.", error: true }); }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [owner]);
  function download(draft: Draft) {
    const url = URL.createObjectURL(new Blob([JSON.stringify(draft.project, null, 2)], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = `vircuit-${draft.id}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    setFeedback({ message: "Unduhan snapshot proyek dimulai.", error: false });
  }
  return <SettingsSection title="Data & Privasi" description="Pahami tempat proyekmu tersimpan dan kelola data browser dengan cakupan yang jelas.">
    <SettingGroup><h3 className="font-medium">Proyek cloud dan draft lokal</h3><p className="text-sm leading-relaxed text-text-secondary">Proyek yang tersimpan di akun berada di cloud. Browser menyimpan draft tamu serta jurnal pemulihan proyek akun di IndexedDB. Ekspor memakai format snapshot Vircuit yang sama dengan simulator.</p><Button variant="outline" asChild><Link href="/dashboard/projects">Kelola proyek cloud</Link></Button></SettingGroup>
    <SettingGroup><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-medium">Draft di browser ini</h3><Button variant="outline" disabled={loading || busy} onClick={() => void load()}>Muat ulang draft</Button></div>{loading ? <p role="status" className="text-sm text-text-secondary">Membaca penyimpanan lokal…</p> : drafts.length === 0 ? <p className="text-sm text-text-secondary">Tidak ada draft akun atau tamu di browser ini.</p> : <ul className="space-y-3">{drafts.map((draft) => <li key={draft.scope} className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-lg border p-3"><div className="min-w-0 flex-1 basis-40"><p className="break-words text-sm font-medium">{draft.project.metadata.name}</p><p className="mt-1 text-xs text-text-secondary">{draft.scope.startsWith("archive:") ? "Arsip pemulihan" : draft.scope === "guest" ? "Draft tamu" : "Draft akun aktif"} · {draft.cloud ? `Terkait cloud revisi ${draft.cloud.revision}` : "Lokal"}</p></div><div className="flex gap-2"><Button variant="outline" size="icon" aria-label={`Ekspor ${draft.project.metadata.name}`} onClick={() => download(draft)}><Download aria-hidden /></Button>{draft.scope.startsWith(`archive:user:${owner}:`) && <Button variant="outline" size="icon" aria-label={`Hapus arsip ${draft.project.metadata.name}`} disabled={busy} onClick={() => setConfirmation(draft)}><Trash2 aria-hidden /></Button>}</div></li>)}</ul>}<p className="text-xs text-text-secondary">Draft aktif dan draft tamu hanya dapat diekspor di sini. Penghapusan terbatas pada arsip akun agar tidak mengganggu autosave tab workspace.</p></SettingGroup>
    <SettingGroup><h3 className="font-medium">Reset preferensi lokal akun</h3><p className="text-sm text-text-secondary">Mengembalikan animasi, kepadatan, grid, snap, dan ukuran bacaan akun ini ke bawaan di browser ini. Tema dan layout workspace dikelola terpisah. Tidak menghapus draft atau proyek cloud.</p><Button variant="outline" onClick={() => setConfirmation("preferences")}>Reset preferensi lokal</Button></SettingGroup>
    <DeleteAccount owner={owner} hasPassword={hasPassword} disabled={anyDirty} />
    <Feedback {...feedback} />
    <Dialog open={confirmation !== null} onOpenChange={(open) => { if (!open && !busy) setConfirmation(null); }}><SettingsDialogContent open={confirmation !== null}><DialogHeader><DialogTitle>{confirmation === "preferences" ? "Reset preferensi lokal?" : "Hapus arsip lokal?"}</DialogTitle><DialogDescription>{confirmation === "preferences" ? "Hanya preferensi akun ini di browser ini yang dikembalikan. Proyek dan draft tetap tersimpan." : `Arsip ${confirmation?.project.metadata.name ?? ""} akan dihapus dari browser ini. Proyek cloud dan draft aktif tidak dihapus. Ekspor cadangan sebelum melanjutkan.`}</DialogDescription></DialogHeader><div className="flex flex-wrap gap-3"><Button variant={confirmation === "preferences" ? "default" : "destructive"} disabled={busy} onClick={async () => {
      if (lock.current || !confirmation) return; lock.current = true; setBusy(true);
      try {
        if (confirmation === "preferences") clearPreferences(owner);
        else {
          if (!confirmation.scope.startsWith(`archive:user:${owner}:`)) throw new Error("Arsip bukan milik akun ini.");
          await deleteDraft(confirmation.scope, confirmation.updatedAt);
          setDrafts((current) => current.filter((draft) => draft.scope !== confirmation.scope));
        }
        setFeedback({ message: confirmation === "preferences" ? "Preferensi lokal dikembalikan ke bawaan." : "Arsip lokal dihapus. Proyek cloud tetap tersimpan.", error: false }); setConfirmation(null);
      } catch (error) { setFeedback({ message: error instanceof Error ? error.message : "Tindakan belum berhasil.", error: true }); setConfirmation(null); }
      finally { lock.current = false; setBusy(false); }
    }}>{busy ? "Memproses…" : "Konfirmasi"}</Button><Button variant="outline" disabled={busy} onClick={() => setConfirmation(null)}>Batal</Button></div></SettingsDialogContent></Dialog>
  </SettingsSection>;
}
