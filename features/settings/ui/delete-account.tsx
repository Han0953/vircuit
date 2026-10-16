"use client";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { clearAccountDrafts } from "@/features/projects/local/drafts";
import { clearPrivateState, flushDraft } from "@/features/projects/local/controller";
import { usePersistence } from "@/features/projects/store";
import { clearPendingAccount } from "@/features/challenges/pending";
import { clearCirraAccount } from "@/features/ai/ui/session-store";
import { clearPreferences } from "../preferences";
import { Feedback, SettingGroup } from "./setting-controls";

export function DeleteAccount({ owner, hasPassword, disabled }: { owner: string; hasPassword: boolean; disabled: boolean }) {
  const [open, setOpen] = useState(false), [busy, setBusy] = useState(false);
  const [confirmation, setConfirmation] = useState(""), [password, setPassword] = useState(""), [code, setCode] = useState("");
  const [feedback, setFeedback] = useState({ message: "", error: false });
  const locked = useRef(false);
  const saving = usePersistence((state) => state.busy);
  async function send(action: "code" | "delete") {
    if (locked.current || usePersistence.getState().busy) return;
    locked.current = true; setBusy(true); setFeedback({ message: "", error: false });
    try {
      if (action === "delete" && usePersistence.getState().userId === owner) await flushDraft();
      const response = await fetch("/api/settings/delete-account", { method: "POST", signal: AbortSignal.timeout(20000), headers: { "Content-Type": "application/json", "x-vircuit-owner": owner }, body: JSON.stringify(action === "code" ? { action } : { action, confirmation, ...(hasPassword ? { password } : { code }) }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Akun belum dihapus.");
      if (action === "code") { setFeedback({ message: result.message, error: false }); return; }
      if (result.deleted !== true) throw new Error("Penghapusan belum dikonfirmasi.");
      clearPrivateState(owner); clearCirraAccount(owner);
      await Promise.allSettled([clearAccountDrafts(owner), clearPendingAccount(owner)]);
      try { clearPreferences(owner); } catch { /* The account is already deleted; navigation must still finish. */ }
      const channel = new BroadcastChannel("vircuit-auth"); channel.postMessage({ type: "account-deleted", owner }); channel.close();
      window.location.replace("/masuk?account=deleted");
    } catch (error) { setFeedback({ message: error instanceof Error ? error.message : "Penghapusan belum selesai. Periksa akun sebelum mencoba lagi.", error: true }); }
    finally { locked.current = false; setBusy(false); setPassword(""); setCode(""); }
  }
  return <SettingGroup><h3 className="font-medium">Hapus akun</h3><p className="text-sm text-text-secondary">Menghapus akun, proyek cloud, progres, dan foto profil secara permanen. Ekspor proyek yang masih kamu perlukan terlebih dahulu.</p><Button variant="destructive" disabled={disabled || saving} onClick={() => { setOpen(true); setConfirmation(""); setFeedback({ message: "", error: false }); }}>Hapus akun</Button>{disabled && <p className="text-xs text-text-secondary">Simpan atau batalkan perubahan formulir terlebih dahulu.</p>}
    <Dialog open={open} onOpenChange={(value) => { if (!busy) { setOpen(value); setPassword(""); setCode(""); } }}><DialogContent className="max-h-[85dvh] overflow-y-auto"><DialogHeader><DialogTitle>Hapus akun secara permanen?</DialogTitle><DialogDescription>Semua proyek cloud, progres, dan foto profil akun ini akan dihapus. Tindakan ini tidak dapat dibatalkan. Draft tamu tetap disimpan di browser.</DialogDescription></DialogHeader>
      <label className="space-y-2 text-sm">Ketik HAPUS AKUN<Input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" disabled={busy} /></label>
      {hasPassword ? <div className="space-y-2"><label htmlFor="delete-password" className="text-sm">Kata sandi untuk konfirmasi</label><PasswordInput id="delete-password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" disabled={busy} /></div> : <div className="space-y-2"><Button variant="outline" disabled={busy} onClick={() => void send("code")}>Kirim kode penghapusan</Button><label className="block text-sm">Kode konfirmasi email<Input inputMode="numeric" value={code} onChange={(event) => setCode(event.target.value)} autoComplete="one-time-code" maxLength={10} disabled={busy} /></label></div>}
      <Feedback {...feedback} /><div className="flex flex-wrap items-center justify-center sm:justify-start gap-3"><Button variant="destructive" disabled={busy || saving || confirmation !== "HAPUS AKUN" || !(hasPassword ? password : code)} onClick={() => void send("delete")}>{busy ? "Memproses…" : "Hapus akun permanen"}</Button><Button variant="outline" disabled={busy} onClick={() => { setOpen(false); setPassword(""); setCode(""); }}>Batal</Button></div>
    </DialogContent></Dialog>
  </SettingGroup>;
}
