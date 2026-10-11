import Link from "next/link";
import { ArrowRight, BookOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { deriveProgress } from "../derive";
import type { ProgressRow } from "../contracts";

export function ContinueLearning({ rows }: { rows: ProgressRow[] | null }) {
  if (!rows) return null;
  const next = deriveProgress(rows).continueLearning;

  return (
    <Card
      data-motion="card"
      className="flex flex-col justify-between p-5 sm:p-6 shadow-xs border-border/70 hover:border-border transition-colors"
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
              <BookOpen className="size-4 shrink-0" aria-hidden="true" />
            </span>
            <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
              {next.review ? "Tinjau Kembali Materi" : "Lanjutkan Belajar"}
            </span>
          </div>
          <Badge variant="secondary" className="gap-1 text-[11px] font-semibold">
            <Sparkles className="size-3 text-primary" aria-hidden="true" />
            Praktik Lab
          </Badge>
        </div>

        <h3 className="mt-3 text-lg font-bold tracking-tight text-foreground sm:text-xl">
          {next.lesson.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">
          {next.lesson.summary}
        </p>
      </div>

      <div className="mt-5 pt-4 border-t border-border/50 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-medium text-text-tertiary">
          Dasar IoT dengan Arduino Uno
        </span>
        <Button asChild size="sm" className="gap-1.5 font-medium">
          <Link href={next.href}>
            {next.review ? "Tinjau Materi" : "Lanjutkan Materi"}
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </Card>
  );
}
