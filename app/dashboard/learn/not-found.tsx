import { BackButton } from "@/components/shared/back-button";

export default function LearningNotFound() {
  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-semibold text-foreground">Materi tidak ditemukan</h1>
      <p className="text-text-secondary">Kursus atau materi yang kamu cari tidak ditemukan.</p>
      <BackButton
        fallbackHref="/dashboard/learn"
        label="Kembali ke Belajar"
        variant="outline"
      />
    </div>
  );
}
