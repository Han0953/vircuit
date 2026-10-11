import { Skeleton } from "@/components/ui/skeleton";

export default function LessonLoading() {
  return (
    <div
      role="status"
      aria-label="Memuat materi lesson"
      className="space-y-6 sm:space-y-8"
    >
      {/* 1. Action bar skeleton */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-24 rounded-md" />
          <span className="text-border hidden sm:inline">/</span>
          <div className="hidden sm:flex items-center gap-2">
            <Skeleton className="h-4 w-14 rounded" />
            <span>/</span>
            <Skeleton className="h-4 w-36 rounded" />
            <span>/</span>
            <Skeleton className="h-4 w-44 rounded" />
          </div>
        </div>
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>

      {/* 2. Main Lesson Content Grid */}
      <div className="grid min-w-0 gap-8 xl:grid-cols-[14rem_minmax(0,1fr)]">
        {/* Sidebar Outline Skeleton */}
        <aside className="hidden self-start rounded-lg border bg-surface p-4 xl:block space-y-4">
          <Skeleton className="h-4 w-28 rounded" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-full rounded" />
            ))}
          </div>
        </aside>

        {/* Article Skeleton */}
        <article className="min-w-0 max-w-[72ch] space-y-8">
          <header className="space-y-3">
            <Skeleton className="h-4 w-40 rounded" />
            <Skeleton className="h-8 w-80 max-w-full rounded-md" />
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-32 rounded" />
          </header>

          {/* Objectives Box */}
          <div className="space-y-3 rounded-lg border bg-surface p-5">
            <Skeleton className="h-5 w-32 rounded" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-5/6 rounded" />
              <Skeleton className="h-4 w-4/6 rounded" />
            </div>
          </div>

          {/* Status Box */}
          <Skeleton className="h-14 w-full rounded-lg" />

          {/* Lesson Content Blocks */}
          <div className="space-y-4">
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-11/12 rounded" />
            <Skeleton className="h-4 w-4/5 rounded" />
            <Skeleton className="h-40 w-full rounded-lg" />
          </div>

          {/* Navigation bar skeleton */}
          <div className="flex justify-between border-t border-border/50 pt-5">
            <Skeleton className="h-9 w-28 rounded-md" />
            <Skeleton className="h-9 w-28 rounded-md" />
          </div>
        </article>
      </div>

      <span className="sr-only">Memuat materi lesson…</span>
    </div>
  );
}
