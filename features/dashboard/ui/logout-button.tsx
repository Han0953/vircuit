"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Download, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { DashboardIdentity } from "./user-menu";
import { logoutAccount } from "@/features/auth/logout";
import { archivedDrafts, readDraft, type Draft } from "@/features/projects/local/drafts";
import { flushDraft } from "@/features/projects/local/controller";
import { usePersistence } from "@/features/projects/store";
import { pendingSubmissions } from "@/features/challenges/pending";


export function LogoutButton({ user, disabled = false, className, iconOnly = false }: { user: DashboardIdentity; disabled?: boolean; className?: string; iconOnly?: boolean }) {
  const router = useRouter();
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [pendingResults, setPendingResults] = useState(0);
  async function prepare(approved = false) {
    if (!approved && !window.dispatchEvent(new CustomEvent("vircuit-before-logout", { cancelable: true, detail: { proceed: () => void prepare(true) } }))) return;
    setOpen(true); setPending(true); setError("");
    try {
      const state = usePersistence.getState();
      if (state.ready && state.userId === user.id) await flushDraft();
      const scope = `user:${user.id}`;
      const draft = await readDraft(scope);
      const archives = await archivedDrafts(scope);
      setPendingResults((await pendingSubmissions(user.id)).length);
      setDrafts([...(draft && draft.localRevision !== draft.savedLocalRevision ? [draft] : []), ...archives]);
    } catch { setError("Draft lokal belum dapat diperiksa. Coba lagi sebelum keluar."); }
    finally { setPending(false); }
  }
  async function leave() {
    setPending(true); setError("");
    try { await logoutAccount(user.id); window.location.replace("/masuk?next=/dashboard"); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Keluar akun gagal."); router.refresh(); }
    finally { setPending(false); }
  }
  function download(draft: Draft) {
    const url = URL.createObjectURL(new Blob([JSON.stringify(draft.project, null, 2)], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = `vircuit-${draft.id}.json`; link.click(); URL.revokeObjectURL(url);
  }
  return <>
    <Button ref={trigger} variant="outline" className={className} aria-label="Keluar akun" title={iconOnly ? "Keluar akun" : undefined} disabled={disabled || pending} onClick={() => void prepare()}><LogOut aria-hidden /><span className={iconOnly ? "sr-only" : undefined}>Keluar akun</span></Button>
    <Dialog open={open} onOpenChange={(value) => { if (!pending) setOpen(value); }}><DialogContent className="max-h-[90dvh] overflow-y-auto" onCloseAutoFocus={(event) => { event.preventDefault(); trigger.current?.focus(); }}>
      <DialogHeader><DialogTitle>Keluar dari akun?</DialogTitle><DialogDescription>Cache draft dan arsip akun di perangkat ini akan dibersihkan. Proyek cloud dan draft tamu tetap tersimpan. Unduh cadangan perubahan akun yang belum tersimpan sebelum keluar.</DialogDescription></DialogHeader>
      {pendingResults > 0 && <p role="status" className="text-sm">{pendingResults} hasil tantangan belum tersinkronisasi. Keluar akan menghapus antrean lokal akun ini. Pilih Batal dan sinkronkan melalui dashboard jika hasilnya masih diperlukan.</p>}
      {drafts.length > 0 && <div className="space-y-2"><p className="text-sm">Unduh cadangan draft dan arsip yang masih diperlukan sebelum keluar.</p>{drafts.map((draft) => <Button key={draft.scope} variant="outline" className="w-full justify-start" onClick={() => download(draft)}><Download aria-hidden /><span className="truncate">{draft.project.metadata.name}</span></Button>)}</div>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2"><Button disabled={pending || !!error} onClick={() => void leave()}>{pending ? "Memproses…" : "Keluar akun"}</Button><Button variant="outline" disabled={pending} onClick={() => setOpen(false)}>Batal</Button>{error && <Button variant="outline" onClick={() => void prepare()}>Coba lagi</Button>}</div>
    </DialogContent></Dialog>
  </>;
}
