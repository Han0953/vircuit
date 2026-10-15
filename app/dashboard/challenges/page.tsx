import type { Metadata } from "next";
import { dashboardGuard } from "@/features/dashboard/server";
import { challengeCatalog } from "@/features/challenges/registry";
import { findLesson } from "@/features/learning/registry";
import { progressForPage } from "@/features/progress/server";
import { ChallengeArenaView } from "@/features/challenges/ui/challenge-arena-view";
import { DashboardMotionSection } from "@/features/dashboard/motion/dashboard-motion";
import { Badge } from "@/components/ui/badge";
import { ProgressError } from "@/features/progress/ui/progress-error";

export const metadata: Metadata = {
  title: "Tantangan",
  description: "Arena tantangan evaluasi sirkuit dan pemrograman IoT di Virtual Lab Vircuit.",
};

export default async function ChallengesPage() {
  await dashboardGuard();
  const challenges = challengeCatalog();
  const progress = await progressForPage();

  // Pre-resolve lessons mapping on server
  const lessonsMap: Record<
    string,
    NonNullable<ReturnType<typeof findLesson>>
  > = {};

  for (const c of challenges) {
    const found = findLesson(c.lessonId);
    if (found) {
      lessonsMap[c.lessonId] = found;
    }
  }

  return (
    <DashboardMotionSection className="space-y-8 sm:space-y-10">
      {/* Header section */}
      <section className="space-y-2 border-b border-border/50 pb-6">
        <div className="flex items-center gap-2" data-motion="header">
          <Badge variant="outline" className="gap-1.5 font-mono text-[11px] font-semibold text-amber-500 border-amber-500/30 bg-amber-500/5">
            <span className="size-1.5 rounded-full bg-amber-500" />
            EVALUASI DETERMINISTIK
          </Badge>
          <span className="text-xs text-text-tertiary">· Virtual Lab Arena</span>
        </div>

        <h1
          data-motion="header"
          className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl"
        >
          Tantangan Eksperimen IoT
        </h1>

        <p
          data-motion="header"
          className="max-w-2xl text-sm leading-relaxed text-text-secondary sm:text-base"
        >
          Uji kebenaran rangkaian dan kode programmu di Virtual Lab. Evaluator otomatis memeriksa koneksi hardware, resistor seri, polaritas, hingga logika runtime tanpa penilaian subjektif.
        </p>
      </section>

      {/* Challenge Arena Interactive View */}
      {!progress.rows && <ProgressError message={progress.error ?? "Status tantangan belum dapat dimuat."} />}
      <ChallengeArenaView
        challenges={challenges}
        lessonsMap={lessonsMap}
        rows={progress.rows ?? []}
        progressAvailable={!!progress.rows}
      />
    </DashboardMotionSection>
  );
}
