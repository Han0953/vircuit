"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cloudRequest, CloudError } from "@/features/projects/cloud/request";
import { safeDestination } from "@/features/auth/redirect";
import { progressRowSchema } from "../contracts";
import type { ProgressRow } from "../contracts";
export function LessonStatus({ owner, lessonId, informational, row }: { owner: string; lessonId: string; informational: boolean; row: ProgressRow | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<ProgressRow | null>(row);
  const [error, setError] = useState(""); const [pending, setPending] = useState(false);
  async function send(action: "open" | "complete") {
    setPending(true); setError("");
    try {
      const confirmed = progressRowSchema.parse(await cloudRequest("/api/progress", "POST", { lessonId, action }, { "X-Vircuit-Account": owner }));
      if (confirmed.user_id !== owner) throw new Error("Session akun berubah. Muat ulang lesson.");
      setState(confirmed); if (action === "complete") router.refresh();
    } catch (cause) {
      if (cause instanceof CloudError && cause.status === 401) router.replace(`/masuk?next=${encodeURIComponent(safeDestination(pathname))}`);
      setError(cause instanceof Error ? cause.message : "Progress belum tersimpan.");
    }
    finally { setPending(false); }
  }
  useEffect(() => {
    const timer = setTimeout(() => { void send("open"); }, 0);
    return () => clearTimeout(timer);
    // A visit records activity once per lesson route, never a completion event.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);
  return <section aria-label="Status belajar" className="space-y-3 rounded-md border p-4 text-sm"><p>Tahap aktif: Materi</p><p role="status">{state?.status === "completed" ? "Materi selesai" : state?.status === "in_progress" ? "Sedang dipelajari" : "Belum ada status tersinkronisasi"}</p>{error && <div role="alert"><p>{error}</p><Button variant="outline" disabled={pending} onClick={() => void send("open")}>Coba lagi</Button></div>}{informational && state?.status !== "completed" && <Button disabled={pending} onClick={() => void send("complete")}>{pending ? "Menyimpan…" : "Selesaikan materi"}</Button>}{!informational && <p className="text-text-secondary">Completion dicatat setelah tantangan terpenuhi dan diverifikasi server.</p>}</section>;
}
