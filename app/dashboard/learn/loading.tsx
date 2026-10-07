export default function LearningLoading() {
  return <div role="status" aria-label="Memuat materi" className="space-y-5"><div className="h-9 w-2/3 animate-pulse rounded bg-surface-muted motion-reduce:animate-none" /><div className="h-60 animate-pulse rounded-lg border bg-surface-muted motion-reduce:animate-none" /><span className="sr-only">Memuat materi…</span></div>;
}
