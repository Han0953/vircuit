"use client";

import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/shared/back-button";

export default function LearningError({ reset }: { reset: () => void }) {
  return (
    <div role="alert" className="space-y-4 rounded-lg border bg-surface p-6">
      <h1 className="text-xl font-semibold">Materi belum dapat dimuat</h1>
      <p className="text-sm text-text-secondary">
        Materi gagal dimuat. Periksa koneksi lalu coba lagi.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="default" onClick={reset}>
          Coba lagi
        </Button>
        <BackButton
          fallbackHref="/dashboard/learn"
          label="Kembali ke Belajar"
          variant="outline"
        />
      </div>
    </div>
  );
}
