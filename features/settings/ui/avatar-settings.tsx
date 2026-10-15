"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { DashboardIdentity } from "@/features/dashboard/ui/user-menu";
import { ProfileAvatar } from "./profile-avatar";
import { Feedback, SettingGroup } from "./setting-controls";

export async function prepareAvatar(file: File) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) throw new Error("Gunakan JPG, PNG, atau WebP, maksimal 5 MB.");
  let bitmap: ImageBitmap;
  try { bitmap = await createImageBitmap(file); }
  catch { throw new Error("Foto tidak dapat dibaca. Pilih file JPG, PNG, atau WebP yang valid."); }
  try {
    if (!bitmap.width || !bitmap.height || bitmap.width * bitmap.height > 16000000) throw new Error("Resolusi foto terlalu besar. Gunakan foto maksimal 16 megapiksel.");
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 256;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Foto belum dapat diproses di browser ini.");
    const side = Math.min(bitmap.width, bitmap.height);
    context.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, 256, 256);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.85));
    if (!blob || blob.type !== "image/webp" || blob.size > 512 * 1024) throw new Error("Foto belum dapat diproses. Coba foto lain.");
    return blob;
  } finally { bitmap.close(); }
}

export function AvatarSettings({ user }: { user: DashboardIdentity }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const locked = useRef(false);
  const [busy, setBusy] = useState(false);
  const [confirmation, setConfirmation] = useState(false);
  const [feedback, setFeedback] = useState({ message: "", error: false });
  async function send(file?: File) {
    if (locked.current) return;
    locked.current = true; setBusy(true); setFeedback({ message: "", error: false });
    try {
      const blob = file ? await prepareAvatar(file) : null;
      const response = await fetch("/api/settings/avatar", { method: file ? "POST" : "DELETE", signal: AbortSignal.timeout(20000), headers: { "Content-Type": file ? "image/webp" : "application/json", "x-vircuit-owner": user.id }, body: blob ?? "{}" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Foto belum tersimpan.");
      setFeedback({ message: file ? "Foto profil berhasil disimpan." : "Foto profil dihapus. Avatar inisial digunakan kembali.", error: false });
      setConfirmation(false);
      router.refresh();
      const channel = new BroadcastChannel("vircuit-auth"); channel.postMessage("profile-updated"); channel.close();
    } catch (error) { setFeedback({ message: error instanceof Error ? error.message : "Foto belum tersimpan. Coba lagi.", error: true }); }
    finally { locked.current = false; setBusy(false); if (input.current) input.current.value = ""; }
  }
  return <SettingGroup>
    <div className="flex min-w-0 items-center gap-4"><ProfileAvatar user={user} className="size-16 rounded-2xl text-xl" /><div className="min-w-0"><h3 className="font-medium">Foto profil</h3><p className="mt-1 text-sm text-text-secondary">JPG, PNG, atau WebP, maksimal 5 MB. Foto dipotong persegi dan disimpan privat.</p></div></div>
    <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" aria-label="Pilih foto profil" disabled={busy} className="sr-only" tabIndex={-1} onChange={(event) => { const file = event.target.files?.[0]; if (file) void send(file); }} />
    <div className="flex flex-wrap gap-3"><Button type="button" variant="outline" disabled={busy} onClick={() => input.current?.click()}><Upload aria-hidden />{busy ? "Memproses…" : user.avatarUrl ? "Ganti foto" : "Unggah foto"}</Button>{user.avatarUrl && <Button type="button" variant="ghost" disabled={busy} onClick={() => setConfirmation(true)}><Trash2 aria-hidden />Hapus foto</Button>}</div>
    <Feedback {...feedback} />
    <Dialog open={confirmation} onOpenChange={(open) => { if (!busy) setConfirmation(open); }}><DialogContent><DialogHeader><DialogTitle>Hapus foto profil?</DialogTitle><DialogDescription>Avatar inisial akan digunakan kembali. Nama dan proyekmu tetap tersimpan.</DialogDescription></DialogHeader><div className="flex gap-3"><Button variant="destructive" disabled={busy} onClick={() => void send()}>Hapus foto</Button><Button variant="outline" disabled={busy} onClick={() => setConfirmation(false)}>Batal</Button></div></DialogContent></Dialog>
  </SettingGroup>;
}
