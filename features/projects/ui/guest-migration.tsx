"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { readDraft, type Draft } from "../local/drafts";
import { migrateGuestDraft } from "../session";
import { usePersistence } from "../store";

export function GuestMigration({ verified }: { verified: boolean }) {
  const owner = usePersistence((state) => state.userId);
  const ready = usePersistence((state) => state.ready);
  const busy = usePersistence((state) => state.busy || state.handoffBusy);
  const query = useSearchParams().toString();
  const [guest, setGuest] = useState<Draft | null>(null);
  const [dismissed, setDismissed] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!verified || !ready || !owner || query || dismissed === owner) return;
    let current = true;
    void readDraft("guest").then((draft) => {
      if (current && draft && (draft.localRevision > 0 || draft.saveIntent || draft.project.components.length > 0)) setGuest(draft);
    }).catch(() => { /* Corrupt guest storage stays untouched; account editing remains available. */ });
    return () => { current = false; };
  }, [verified, ready, owner, query, dismissed]);
  const close = () => { if (!pending && owner) { setDismissed(owner); setGuest(null); setError(""); } };
  return <Dialog open={!!guest && !!owner && !query && dismissed !== owner} onOpenChange={(open) => { if (!open) close(); }}>
    <DialogContent className="max-h-[90dvh] overflow-y-auto" onEscapeKeyDown={(event) => { if (pending) event.preventDefault(); }} onPointerDownOutside={(event) => { if (pending) event.preventDefault(); }}>
      <DialogHeader><DialogTitle>Simpan draft tamu ke akun?</DialogTitle><DialogDescription>Draft “{guest?.project.metadata.name}” tersedia di browser ini. Proyek akun aktif dicadangkan sebelum draft dipindahkan. Draft tamu baru dihapus setelah penyimpanan cloud dikonfirmasi.</DialogDescription></DialogHeader>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-wrap gap-2"><Button disabled={pending || busy} onClick={() => {
        if (!guest) return;
        setPending(true); setError("");
        void migrateGuestDraft(guest.id).then(() => { setDismissed(owner!); setGuest(null); }).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Draft belum tersimpan. Coba lagi.")).finally(() => setPending(false));
      }}>{pending ? "Menyimpan…" : error ? "Coba lagi" : "Simpan ke akun"}</Button><Button variant="outline" disabled={pending} onClick={close}>Nanti saja</Button></div>
    </DialogContent>
  </Dialog>;
}
