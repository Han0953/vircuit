export default function ProgressLoading() {
  return <div role="status" className="space-y-4"><p>Memuat progress…</p><div aria-hidden className="h-48 rounded-lg bg-surface-muted motion-safe:animate-pulse" /></div>;
}
