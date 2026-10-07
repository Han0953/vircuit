"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { pendingSubmissions, type PendingSubmission } from "../pending";
import { syncSubmission } from "../sync";
import { findChallenge } from "../registry";
export function PendingChallenges({ owner }: { owner: string }) {
  const [items, setItems] = useState<PendingSubmission[]>([]);
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const router = useRouter();
  useEffect(() => {
    let active = true;
    void pendingSubmissions(owner).then((value) => { if (active) setItems(value); }).catch(() => { if (active) setError("Antrean hasil lokal belum dapat dibaca."); });
    return () => { active = false; };
  }, [owner]);
  async function retry(item: PendingSubmission) {
    setBusy(true); setError("");
    try { await syncSubmission(item); setItems(await pendingSubmissions(owner)); router.refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Sinkronisasi gagal."); }
    finally { setBusy(false); }
  }
  if (!items.length && !error) return null;
  return <section aria-label="Hasil belum tersinkronisasi" className="space-y-4 rounded-lg border bg-surface p-5"><h2 className="font-semibold">Hasil lokal — belum tersinkronisasi</h2><p className="text-sm text-text-secondary">Progress akun baru berubah setelah server memverifikasi dan menyimpan hasil.</p>{error && <p role="alert" className="text-sm">{error}</p>}<ul className="space-y-3">{items.map((item) => <li key={item.key} className="flex flex-wrap items-center justify-between gap-3 text-sm"><span>{findChallenge(item.submission.challengeId)?.title ?? "Versi tantangan lama"} · {item.preview.passed ? "Terpenuhi secara lokal" : "Belum terpenuhi"}</span><Button variant="outline" disabled={busy} onClick={() => void retry(item)}>{busy ? "Menyinkronkan…" : "Coba sinkronkan"}</Button></li>)}</ul></section>;
}
