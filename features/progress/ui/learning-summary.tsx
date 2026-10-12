import Link from "next/link";
import { ArrowRight, ChartNoAxesColumn } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { deriveProgress } from "../derive";
import { ProgressError } from "./progress-error";
import type { ProgressRow } from "../contracts";

export function LearningSummary({
  rows,
  error,
}: {
  rows: ProgressRow[] | null;
  error: string | null;
}) {
  if (!rows) return <ProgressError message={error ?? "Progress belum dapat dimuat dari akun."} />;

  const data = deriveProgress(rows);
  const percentage = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;

  return (
    <Card
      data-motion="card"
      className="flex flex-col justify-between p-5 sm:p-6 shadow-xs border-border/70 hover:border-border transition-colors"
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-500">
              <ChartNoAxesColumn className="size-4 shrink-0" aria-hidden="true" />
            </span>
            <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
              Kemajuan Kurikulum
            </span>
          </div>
          <span className="font-mono text-xs font-bold text-foreground">
            {percentage}% Selesai
          </span>
        </div>

        <div className="mt-4">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
              Dasar IoT dengan Arduino Uno
            </h3>
            <span className="text-xs font-medium text-text-secondary">
              {data.completed} dari {data.total} Materi
            </span>
          </div>

          {/* Animated Progress Meter */}
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-muted">
            <div
              data-motion="meter"
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Modules breakdown */}
        <div className="mt-4 space-y-2">
          {data.courses.flatMap((c) => c.modules).map(({ module, completed, total }) => {
            const modPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
            return (
              <div
                key={module.id}
                className="flex items-center justify-between gap-2 text-xs text-text-secondary"
              >
                <span className="truncate">{module.title}</span>
                <span className="font-mono font-medium text-foreground">
                  {completed}/{total} ({modPercent}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-border/50 flex items-center justify-between gap-2">
        <span className="text-xs text-text-tertiary">
          Berdasarkan penyelesaian materi di akun
        </span>
        <Button asChild variant="ghost" size="sm" className="gap-1.5 font-medium text-primary">
          <Link href="/dashboard/progress">
            Lihat progress
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </Card>
  );
}
