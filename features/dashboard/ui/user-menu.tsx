"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, LogOut, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { logoutAccount } from "@/features/auth/logout";
import { archivedDrafts, readDraft, type Draft } from "@/features/projects/local/drafts";
import { flushDraft } from "@/features/projects/local/controller";
import { usePersistence } from "@/features/projects/store";

export type DashboardIdentity = { id: string; name: string; email: string };
export function UserMenu({ user }: { user: DashboardIdentity }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [drafts, setDrafts] = useState<Draft[]>([]);
  async function prepare() {
    setOpen(true); setPending(true); setError("");
    try {
      const state = usePersistence.getState();
      if (state.ready && state.userId === user.id) await flushDraft();
      const scope = `user:${user.id}`;
      const draft = await readDraft(scope);
      const archives = await archivedDrafts(scope);
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
  return <div className="flex items-center gap-1">
    <ThemeToggle />
    <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label="Menu akun"><UserRound aria-hidden /></Button></DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-w-[calc(100vw-2rem)]">
        <DropdownMenuLabel className="max-w-64 break-all">{user.name}<span className="block text-xs font-normal text-text-secondary">{user.email}</span></DropdownMenuLabel>
        <DropdownMenuSeparator /><DropdownMenuItem onSelect={() => void prepare()}><LogOut aria-hidden />Keluar akun</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <Dialog open={open} onOpenChange={(value) => { if (!pending) setOpen(value); }}><DialogContent className="max-h-[90dvh] overflow-y-auto">
      <DialogHeader><DialogTitle>Keluar dari akun?</DialogTitle><DialogDescription>Cache proyek akun di perangkat ini akan dibersihkan. Proyek cloud dan draft tamu tetap tersimpan.</DialogDescription></DialogHeader>
      {drafts.length > 0 && <div className="space-y-2"><p className="text-sm">Unduh cadangan draft dan arsip yang masih diperlukan sebelum keluar.</p>{drafts.map((draft) => <Button key={draft.scope} variant="outline" className="w-full justify-start" onClick={() => download(draft)}><Download aria-hidden /><span className="truncate">{draft.project.metadata.name}</span></Button>)}</div>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-wrap gap-2"><Button disabled={pending || !!error} onClick={() => void leave()}>{pending ? "Memproses…" : "Keluar akun"}</Button><Button variant="outline" disabled={pending} onClick={() => setOpen(false)}>Batal</Button>{error && <Button variant="outline" onClick={() => void prepare()}>Coba lagi</Button>}</div>
    </DialogContent></Dialog>
  </div>;
}
