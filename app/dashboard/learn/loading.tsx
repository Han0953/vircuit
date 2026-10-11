import { Skeleton } from "@/components/ui/skeleton";

export default function LearningLoading() {
  return (
    <div
      role="status"
      aria-label="Memuat kurikulum belajar"
      className="space-y-8 sm:space-y-10"
    >
      {/* 1. Curriculum Hero Banner Skeleton */}
      <section className="relative overflow-hidden rounded-2xl border border-border/80 bg-surface p-6 sm:p-8 lg:p-10 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-5 w-36 rounded-full" />
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-5 w-28 rounded-full" />
        </div>

        <Skeleton className="h-9 w-80 max-w-full rounded-lg" />

        <div className="space-y-2 max-w-3xl">
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-5/6 rounded" />
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Skeleton className="h-10 w-44 rounded-lg" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-20 rounded" />
            <Skeleton className="h-4 w-28 rounded" />
          </div>
        </div>
      </section>

      {/* 2. Module Roadmap Grid Skeleton */}
      <section className="space-y-6">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-64 rounded-md" />
          <Skeleton className="h-4 w-96 max-w-full rounded" />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col justify-between rounded-xl border border-border/80 bg-surface p-5 sm:p-6 shadow-xs space-y-5"
            >
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="size-7 rounded-md" />
                    <Skeleton className="h-3 w-16 rounded" />
                  </div>
                  <Skeleton className="h-5 w-24 rounded-full" />
                </div>

                <Skeleton className="h-6 w-3/4 rounded-md" />
                <Skeleton className="h-4 w-full rounded" />

                {/* Progress bar */}
                <Skeleton className="h-1.5 w-full rounded-full" />

                {/* Lesson items checklist */}
                <div className="space-y-2 border-t border-border/50 pt-3">
                  <Skeleton className="h-3 w-24 rounded" />
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, j) => (
                      <div
                        key={j}
                        className="flex items-center justify-between rounded-lg p-2 bg-surface-muted/40"
                      >
                        <div className="flex items-center gap-2.5">
                          <Skeleton className="size-4 rounded-full" />
                          <Skeleton className="h-4 w-48 max-w-[180px] sm:max-w-xs rounded" />
                        </div>
                        <Skeleton className="h-4 w-10 rounded" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-border/50 pt-3">
                <Skeleton className="h-9 w-full rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Learning Summary Telemetry Skeleton */}
      <section className="space-y-4">
        <div className="space-y-1">
          <Skeleton className="h-6 w-52 rounded" />
          <Skeleton className="h-4 w-80 max-w-full rounded" />
        </div>
        <div className="rounded-xl border border-border/80 bg-surface p-6 shadow-xs space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2 rounded-lg bg-surface-muted/60 p-4">
                <Skeleton className="h-4 w-28 rounded" />
                <Skeleton className="h-7 w-16 rounded" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <span className="sr-only">Memuat kurikulum belajar…</span>
    </div>
  );
}
