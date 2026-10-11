import { Skeleton } from "@/components/ui/skeleton";

export default function ChallengesLoading() {
  return (
    <div
      role="status"
      aria-label="Memuat tantangan"
      className="space-y-8 sm:space-y-10"
    >
      {/* 1. Header Section Skeleton */}
      <section className="space-y-2 border-b border-border/50 pb-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-44 rounded-full" />
          <Skeleton className="h-4 w-28 rounded" />
        </div>
        <Skeleton className="h-9 w-72 max-w-full rounded-lg" />
        <div className="space-y-1.5 max-w-2xl">
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-4/5 rounded" />
        </div>
      </section>

      {/* 2. Filter Pills Skeleton */}
      <div className="flex flex-wrap items-center gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-28 rounded-full" />
        ))}
      </div>

      {/* 3. 6 Challenge Cards Grid Skeleton */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col justify-between rounded-xl border border-border/80 bg-surface p-5 sm:p-6 shadow-xs space-y-6"
          >
            <div className="space-y-4">
              {/* Header: Icon + Order + Status */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <Skeleton className="size-9 rounded-lg" />
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-20 rounded" />
                    <Skeleton className="h-3 w-24 rounded" />
                  </div>
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>

              {/* Title & Objective */}
              <Skeleton className="h-6 w-3/4 rounded-md" />
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-full rounded" />
                <Skeleton className="h-3.5 w-4/5 rounded" />
              </div>

              {/* Skills & Hardware badges */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="border-t border-border/50 pt-4 space-y-2.5">
              <Skeleton className="h-3.5 w-36 rounded" />
              <div className="flex justify-end">
                <Skeleton className="h-9 w-32 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <span className="sr-only">Memuat tantangan…</span>
    </div>
  );
}
