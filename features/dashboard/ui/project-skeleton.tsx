import { Skeleton } from "@/components/ui/skeleton";

export function ProjectSkeleton() {
  return (
    <div
      role="status"
      aria-label="Memuat proyek"
      className="space-y-8 sm:space-y-10"
    >
      {/* 1. Workspace Header Skeleton */}
      <section className="flex flex-col justify-between gap-5 border-b border-border/50 pb-6 sm:flex-row sm:items-center">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-40 rounded-full" />
            <Skeleton className="h-4 w-32 rounded" />
          </div>
          <Skeleton className="h-9 w-52 max-w-full rounded-lg" />
          <div className="space-y-1.5 max-w-2xl">
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-4/5 rounded" />
          </div>
        </div>
        <Skeleton className="h-10 w-32 rounded-lg shrink-0" />
      </section>

      {/* 2. Search & Filter Bar Skeleton */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-32 rounded" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
        <Skeleton className="h-10 w-24 rounded-lg shrink-0" />
      </div>

      {/* 3. 6 Projects Grid Skeleton */}
      <div className="grid min-w-0 gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="flex flex-col justify-between rounded-xl border border-border/70 bg-surface p-4 shadow-xs space-y-4"
          >
            <div className="space-y-3.5">
              {/* Schematic thumbnail preview skeleton */}
              <Skeleton className="h-28 w-full rounded-lg" />

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-14 rounded-full" />
                  <Skeleton className="h-3 w-24 rounded" />
                </div>
                <Skeleton className="h-5 w-44 rounded" />
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border/40 pt-3">
              <Skeleton className="h-3.5 w-20 rounded" />
              <Skeleton className="h-8 w-28 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      <span className="sr-only">Memuat proyek…</span>
    </div>
  );
}
