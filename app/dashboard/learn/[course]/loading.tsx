import { Skeleton } from "@/components/ui/skeleton";

export default function CourseLoading() {
  return (
    <div
      role="status"
      aria-label="Memuat kurikulum materi"
      className="space-y-6 sm:space-y-8"
    >
      {/* 1. Navigation & Back Button Skeleton */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-36 rounded-md" />
          <span className="text-border hidden sm:inline">/</span>
          <div className="hidden sm:flex items-center gap-2">
            <Skeleton className="h-4 w-14 rounded" />
            <span>/</span>
            <Skeleton className="h-4 w-40 rounded" />
          </div>
        </div>
        <Skeleton className="h-5 w-24 rounded-full" />
      </div>

      {/* 2. Course Header Banner Skeleton */}
      <header className="relative overflow-hidden rounded-2xl border border-border/80 bg-surface p-6 sm:p-8 lg:p-10 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-5 w-32 rounded-full" />
          <Skeleton className="h-5 w-28 rounded-full" />
          <Skeleton className="h-5 w-28 rounded-full" />
        </div>

        <Skeleton className="h-9 w-72 max-w-full rounded-lg" />

        <div className="space-y-2 max-w-3xl">
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-4/5 rounded" />
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Skeleton className="h-10 w-44 rounded-lg" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-20 rounded" />
            <Skeleton className="h-4 w-28 rounded" />
          </div>
        </div>
      </header>

      {/* 3. Syllabus Outline Card Skeleton */}
      <section className="space-y-4">
        <div className="space-y-1">
          <Skeleton className="h-7 w-56 rounded-md" />
          <Skeleton className="h-4 w-80 max-w-full rounded" />
        </div>

        <div className="max-w-4xl rounded-xl border border-border/80 bg-surface p-5 sm:p-7 shadow-xs space-y-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-5 w-48 rounded" />
              <div className="space-y-2 pl-2">
                {Array.from({ length: 2 }).map((_, j) => (
                  <div
                    key={j}
                    className="flex items-center gap-3 rounded-md p-2 bg-surface-muted/40"
                  >
                    <Skeleton className="h-4 w-6 rounded" />
                    <Skeleton className="h-4 w-52 max-w-xs rounded" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <span className="sr-only">Memuat kurikulum materi…</span>
    </div>
  );
}
