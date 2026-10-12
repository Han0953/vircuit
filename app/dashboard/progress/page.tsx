import Link from "next/link";
import type { Metadata } from "next";
import { Award, Layers, RefreshCcw } from "lucide-react";
import { dashboardIdentity } from "@/features/dashboard/server";
import { progressForPage } from "@/features/progress/server";
import { deriveProgress } from "@/features/progress/derive";
import { ProgressError } from "@/features/progress/ui/progress-error";
import { LearningSummary } from "@/features/progress/ui/learning-summary";
import { ContinueLearning } from "@/features/progress/ui/continue-learning";
import { CourseOutline } from "@/features/learning/ui/course-outline";
import { DashboardMotionSection } from "@/features/dashboard/motion/dashboard-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Progress Belajar",
  description: "Analitik dan rekam jejak penyelesaian kurikulum IoT di akun Vircuit.",
};

export default async function ProgressPage() {
  await dashboardIdentity();
  const result = await progressForPage();

  if (!result.rows) {
    return (
      <DashboardMotionSection className="space-y-6">
        <header className="space-y-2 border-b border-border/50 pb-6" data-motion="header">
          <Badge variant="outline" className="gap-1.5 font-mono text-[11px] font-semibold text-rose-500 border-rose-500/30 bg-rose-500/5">
            <RefreshCcw className="size-3" />
            TELEMETRI AKUN
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Progress Belajar
          </h1>
          <p className="text-sm text-text-secondary">
            Catatan progres belajar tersimpan di akun cloudmu.
          </p>
        </header>
        <ProgressError message={result.error ?? "Progress belum dapat dimuat dari cloud."} />
      </DashboardMotionSection>
    );
  }

  const data = deriveProgress(result.rows);

  return (
    <DashboardMotionSection className="space-y-8 sm:space-y-10">
      {/* 1. Analytics Header */}
      <section className="space-y-2 border-b border-border/50 pb-6">
        <div className="flex items-center gap-2" data-motion="header">
          <Badge variant="outline" className="gap-1.5 font-mono text-[11px] font-semibold text-emerald-500 border-emerald-500/30 bg-emerald-500/5">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            TELEMETRI & ANALITIK BELAJAR
          </Badge>
          <span className="text-xs text-text-tertiary">· Rekam Jejak Akun</span>
        </div>

        <h1
          data-motion="header"
          className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl"
        >
          Progress Belajar Akun
        </h1>

        <p
          data-motion="header"
          className="max-w-2xl text-sm leading-relaxed text-text-secondary sm:text-base"
        >
          Data penyelesaian materi dan cakupan keterampilan yang tercatat di akunmu. Metrik ini murni merefleksikan materi yang telah diselesaikan di Virtual Lab, bukan skor perkiraan.
        </p>
      </section>

      {/* 2. Top Summary & Spotlight */}
      <section className="grid gap-5 md:grid-cols-2">
        <LearningSummary {...result} />
        <ContinueLearning rows={result.rows} />
      </section>

      {/* 3. Skill Coverage Matrix */}
      <section aria-labelledby="skills-heading" className="space-y-4">
        <div data-motion="header">
          <div className="flex items-center gap-2">
            <Award className="size-4 text-cyan-500" aria-hidden="true" />
            <h2 id="skills-heading" className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
              Cakupan Keterampilan IoT
            </h2>
          </div>
          <p className="text-xs text-text-secondary">
            Penyelesaian materi per topik: elektronika, digital I/O, analog PWM, dan debugging.
          </p>
        </div>

        <Card data-motion="card" className="p-5 sm:p-6 shadow-xs border-border/70">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.skills.map((skill) => {
              const percent = skill.total > 0 ? Math.round((skill.completed / skill.total) * 100) : 0;
              return (
                <div key={skill.name} data-motion="item" className="space-y-2 rounded-lg bg-surface-muted/60 p-3.5">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-foreground truncate">{skill.name}</span>
                    <span className="font-mono text-xs font-bold text-primary">
                      {skill.completed}/{skill.total} ({percent}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface">
                    <div
                      data-motion="meter"
                      className="h-full rounded-full bg-cyan-500 transition-all duration-300"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </section>

      {/* 4. Detailed Course Modules Outline */}
      {data.courses.map(({ course, modules }) => (
        <section key={course.id} aria-labelledby={`course-${course.id}`} className="space-y-4">
          <div data-motion="header" className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Layers className="size-4 text-primary" aria-hidden="true" />
                <h2 id={`course-${course.id}`} className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
                  <Link href={`/dashboard/learn/${course.slug}`} className="hover:text-primary transition-colors">
                    {course.title}
                  </Link>
                </h2>
              </div>
              <p className="text-xs text-text-secondary">
                Rincian penyelesaian per modul kurikulum.
              </p>
            </div>
            <Badge variant="outline" className="text-xs font-mono font-medium">
              {course.lessons.length} Total Materi
            </Badge>
          </div>

          <Card data-motion="card" className="p-5 sm:p-6 shadow-xs border-border/70 space-y-5">
            {/* Module progress breakdown */}
            <div className="grid gap-3 sm:grid-cols-2">
              {modules.map(({ module, completed, total }) => {
                const modPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
                return (
                  <div key={module.id} className="space-y-1.5 rounded-lg border border-border/50 p-3 bg-surface">
                    <div className="flex items-center justify-between gap-2 text-xs font-medium">
                      <span className="truncate">{module.title}</span>
                      <span className="font-mono font-bold text-foreground">
                        {completed}/{total}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
                      <div
                        data-motion="meter"
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${modPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Hierarchical Lesson Checklist */}
            <div className="border-t border-border/50 pt-4">
              <p className="mb-3 text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                Daftar Pelajaran:
              </p>
              <CourseOutline course={course} rows={result.rows} />
            </div>
          </Card>
        </section>
      ))}
    </DashboardMotionSection>
  );
}
