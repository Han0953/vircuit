"use client";
import { Button } from "@/components/ui/button";
export default function LearningError({ reset }: { reset: () => void }) {
  return <div role="alert" className="space-y-4 rounded-lg border bg-surface p-6"><h1 className="text-xl font-semibold">Materi belum dapat dimuat</h1><p>Konten atau koneksi belum tersedia. Coba muat ulang.</p><Button variant="outline" onClick={reset}>Coba lagi</Button></div>;
}
