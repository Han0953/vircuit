import { Skeleton } from "@/components/ui/skeleton";

export default function ProgressLoading() {
  return (
    <div
      role="status"
      aria-label="Memuat progress belajar"
      className="space-y-8 sm:space-y-10"
    >
      {/* 1. Analytics Header Skeleton */}
      <section className="space-y-2 border-b border-border/50 pb-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-48 rounded-full" />
          <Skeleton className="h-4 w-28 rounded" />
        </div>
        <Skeleton className="h-9 w-64 max-w-full rounded-lg" />
        <div className="space-y-1.5 max-w-2xl">
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-3/4 rounded" />
        </div>
      </section>

      {/* 2. Top Summary & Spotlight Skeleton */}
      <section className="grid gap-5 md:grid-cols-2">
        {/* Learning Summary Card */}
        <div className="rounded-xl border border-border/70 bg-surface p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-32 rounded" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="rounded-lg bg-surface-muted/60 p-3 space-y-1">
              <Skeleton className="h-3 w-16 rounded" />
              <Skeleton className="h-6 w-12 rounded" />
            </div>
            <div className="rounded-lg bg-surface-muted/60 p-3 space-y-1">
              <Skeleton className="h-3 w-20 rounded" />
              <Skeleton className="h-6 w-12 rounded" />
            </div>
          </div>
        </div>

        {/* Continue Learning Card */}
        <div className="flex flex-col justify-between rounded-xl border border-border/70 bg-surface p-5 sm:p-6 shadow-xs space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="size-7 rounded-md" />
                <Skeleton className="h-3 w-28 rounded" />
              </div>
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="h-6 w-3/4 rounded" />
            <Skeleton className="h-4 w-full rounded" />
          </div>
          <div className="flex items-center justify-between border-t border-border/50 pt-4">
            <Skeleton className="h-3 w-32 rounded" />
            <Skeleton className="h-8 w-28 rounded-lg" />
          </div>
        </div>
      </section>

      {/* 3. Skill Coverage Matrix Skeleton */}
      <section className="space-y-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Skeleton className="size-4 rounded" />
            <Skeleton className="h-6 w-48 rounded" />
          </div>
          <Skeleton className="h-3.5 w-72 rounded" />
        </div>

        <div className="rounded-xl border border-border/70 bg-surface p-5 sm:p-6 shadow-xs">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="space-y-2 rounded-lg bg-surface-muted/60 p-3.5"
              >
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24 rounded" />
                  <Skeleton className="h-4 w-12 rounded" />
                </div>
                <Skeleton className="h-1.5 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Course Modules Breakdown Skeleton */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Skeleton className="size-4 rounded" />
              <Skeleton className="h-6 w-44 rounded" />
            </div>
            <Skeleton className="h-3.5 w-52 rounded" />
          </div>
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>

        <div className="rounded-xl border border-border/70 bg-surface p-5 sm:p-6 shadow-xs space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="space-y-2 rounded-lg border border-border/50 bg-surface p-3"
              >
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-32 rounded" />
                  <Skeleton className="h-4 w-10 rounded" />
                </div>
                <Skeleton className="h-1.5 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <span className="sr-only">Memuat progress belajar…</span>
    </div>
  );
}
