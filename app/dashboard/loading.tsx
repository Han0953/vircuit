import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div
      role="status"
      aria-label="Memuat dashboard"
      className="space-y-8 sm:space-y-10"
    >
      {/* 1. Command Center Hero Skeleton */}
      <section className="flex flex-col justify-between gap-5 border-b border-border/50 pb-6 sm:flex-row sm:items-center">
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-40 rounded-full" />
            <Skeleton className="h-4 w-28 rounded" />
          </div>
          <Skeleton className="h-9 w-64 max-w-full rounded-lg" />
          <Skeleton className="h-4 w-96 max-w-full rounded" />
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <Skeleton className="h-10 w-32 rounded-lg" />
          <Skeleton className="h-10 w-28 rounded-lg" />
        </div>
      </section>

      {/* 2. KPI Telemetry Grid Skeleton */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col justify-between rounded-xl border border-border/70 bg-surface p-5 space-y-3.5 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="size-9 rounded-lg" />
              <Skeleton className="h-4 w-20 rounded" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-8 w-20 rounded-md" />
              <Skeleton className="h-3 w-32 rounded" />
            </div>
          </div>
        ))}
      </section>

      {/* 3. Dual Spotlight Section Skeleton */}
      <section className="grid gap-5 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col justify-between rounded-xl border border-border/70 bg-surface p-5 sm:p-6 shadow-xs space-y-6"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="size-7 rounded-md" />
                  <Skeleton className="h-3 w-28 rounded" />
                </div>
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-6 w-3/4 rounded" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-5/6 rounded" />
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-border/50 pt-4">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-9 w-28 rounded-lg" />
            </div>
          </div>
        ))}
      </section>

      {/* 4. Recent Projects Section Skeleton */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-6 w-36 rounded" />
            <Skeleton className="h-3 w-56 rounded" />
          </div>
          <Skeleton className="h-8 w-28 rounded-lg" />
        </div>
        <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col justify-between rounded-xl border border-border/70 bg-surface p-4 shadow-xs space-y-4"
            >
              <div className="space-y-3">
                <Skeleton className="h-28 w-full rounded-lg" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-14 rounded-full" />
                  <Skeleton className="h-3 w-24 rounded" />
                </div>
                <Skeleton className="h-5 w-44 rounded" />
              </div>
              <div className="flex items-center justify-between border-t border-border/40 pt-3">
                <Skeleton className="h-3 w-20 rounded" />
                <Skeleton className="h-8 w-24 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <span className="sr-only">Memuat dashboard…</span>
    </div>
  );
}
