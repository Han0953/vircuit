import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Circle,
  Cpu,
  Layers,
  PlayCircle,
  Sparkles,
} from "lucide-react";
import { dashboardIdentity } from "@/features/dashboard/server";
import { learningCatalog, lessonHref } from "@/features/learning/registry";
import { progressForPage } from "@/features/progress/server";
import { LearningSummary } from "@/features/progress/ui/learning-summary";
import { DashboardMotionSection } from "@/features/dashboard/motion/dashboard-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Belajar",
  description: "Roadmap kurikulum resmi IoT berbasis Virtual Lab Vircuit.",
};

export default async function LearningPage() {
  await dashboardIdentity();
  const courses = learningCatalog();
  const progress = await progressForPage();
  const rows = progress.rows ?? [];

  // Helper to determine status of a lesson
  const getLessonStatus = (lessonId: string) => {
    const row = rows.find((r) => r.lesson_id === lessonId);
    if (!row) return "unstarted";
    return row.status; // "in_progress" | "completed"
  };

  const course = courses[0]; // Official "Dasar IoT dengan Arduino Uno"

  return (
    <DashboardMotionSection className="space-y-8 sm:space-y-10">
      {/* 1. Curriculum Hero Banner */}
      <section className="relative overflow-hidden rounded-2xl border border-border/80 bg-surface p-6 sm:p-8 lg:p-10 shadow-xs">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="flex flex-wrap items-center gap-2" data-motion="header">
            <Badge variant="outline" className="gap-1.5 font-mono text-[11px] font-semibold text-primary border-primary/30 bg-primary/5">
              <span className="size-1.5 rounded-full bg-primary" />
              KURIKULUM RESMI
            </Badge>
            <Badge variant="secondary" className="text-[11px] font-medium">
              Tingkat Pemula
            </Badge>
            <Badge variant="outline" className="gap-1 text-[11px] font-mono">
              <Cpu className="size-3 text-primary" aria-hidden="true" />
              Arduino Uno R3
            </Badge>
            <span role="heading" aria-level={2} className="text-xs text-text-tertiary">
              · Belajar dengan praktik
            </span>
          </div>

          <h1
            data-motion="header"
            className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl"
          >
            {course ? course.title : "Dasar IoT dengan Arduino Uno"}
          </h1>

          <p
            data-motion="header"
            className="text-sm leading-relaxed text-text-secondary sm:text-base"
          >
            {course
              ? course.description
              : "Pahami konsep elektronika dasar, pemrograman mikrokontroler, sensor analog, hingga pembuatan proyek Traffic Light di Virtual Lab."}
          </p>

          <div data-motion="action" className="flex flex-wrap items-center gap-3 pt-2">
            {course && (
              <Button asChild size="default" className="gap-2 font-medium">
                <Link href={`/dashboard/learn/${course.slug}`}>
                  Mulai Jalur Belajar
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            )}
            <div className="flex items-center gap-3 text-xs text-text-tertiary">
              <span className="flex items-center gap-1">
                <Layers className="size-3.5" aria-hidden="true" />
                {course?.modules.length ?? 4} Modul
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <BookOpen className="size-3.5" aria-hidden="true" />
                {course?.lessons.length ?? 7} Materi Praktik
              </span>
            </div>
          </div>
        </div>

        {/* Decorative blueprint trace background */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 size-80 rounded-full bg-primary/5 blur-3xl"
        />
      </section>

      {/* 2. Interactive Module Roadmap Section */}
      {course && (
        <section aria-labelledby="roadmap-heading" className="space-y-6">
          <div data-motion="header" className="space-y-1">
            <h2 id="roadmap-heading" className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Roadmap Pembelajaran Mandiri
            </h2>
            <p className="text-xs text-text-secondary sm:text-sm">
              Selesaikan modul secara berurutan: pelajari konsep teorinya, lalu uji rangkaian dan program di Virtual Lab.
            </p>
          </div>

          {/* Module Nodes Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {course.modules.map((module, idx) => {
              const moduleLessons = course.lessons.filter((l) => l.moduleId === module.id);
              const completedCount = moduleLessons.filter(
                (l) => getLessonStatus(l.id) === "completed"
              ).length;
              const modulePercent =
                moduleLessons.length > 0
                  ? Math.round((completedCount / moduleLessons.length) * 100)
                  : 0;

              return (
                <Card
                  key={module.id}
                  data-motion="card"
                  className="flex flex-col justify-between overflow-hidden rounded-xl border border-border/80 bg-surface p-5 sm:p-6 shadow-xs hover:border-border transition-colors"
                >
                  <div>
                    {/* Module Header */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="flex size-7 items-center justify-center rounded-md bg-primary/10 font-mono text-xs font-bold text-primary">
                          0{idx + 1}
                        </span>
                        <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                          Modul {module.order}
                        </span>
                      </div>
                      <Badge
                        variant={modulePercent === 100 ? "default" : "secondary"}
                        className="text-[10px] font-semibold font-mono"
                      >
                        {completedCount}/{moduleLessons.length} Selesai ({modulePercent}%)
                      </Badge>
                    </div>

                    <h3 className="mt-3 text-lg font-bold tracking-tight text-foreground sm:text-xl">
                      {module.title}
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">
                      {moduleLessons.length} materi terstruktur dengan simulasi dan eksperimen Virtual Lab.
                    </p>

                    {/* Progress Bar */}
                    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
                      <div
                        data-motion="meter"
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${modulePercent}%` }}
                      />
                    </div>

                    {/* Constituent Lessons List */}
                    <div className="mt-5 space-y-2 border-t border-border/50 pt-3">
                      <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">
                        Daftar Materi:
                      </p>
                      <ul className="space-y-1.5">
                        {moduleLessons.map((lesson) => {
                          const status = getLessonStatus(lesson.id);
                          return (
                            <li key={lesson.id}>
                              <Link
                                href={lessonHref(course, lesson)}
                                className="group flex items-center justify-between gap-2 rounded-lg p-2 text-xs transition-colors hover:bg-surface-muted"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  {status === "completed" ? (
                                    <CheckCircle2 className="size-4 shrink-0 text-emerald-500" aria-hidden="true" />
                                  ) : status === "in_progress" ? (
                                    <PlayCircle className="size-4 shrink-0 text-primary animate-pulse" aria-hidden="true" />
                                  ) : (
                                    <Circle className="size-4 shrink-0 text-text-tertiary" aria-hidden="true" />
                                  )}
                                  <span className="truncate font-medium text-foreground group-hover:text-primary transition-colors">
                                    {lesson.order}. {lesson.title}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  {lesson.practice && (
                                    <Badge variant="outline" className="text-[9px] px-1 py-0 text-primary border-primary/20">
                                      <Sparkles className="size-2.5 mr-0.5" />
                                      Lab
                                    </Badge>
                                  )}
                                  <ArrowRight className="size-3 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-border/50">
                    <Button asChild variant="outline" size="sm" className="w-full gap-1.5 font-medium">
                      <Link href={`/dashboard/learn/${course.slug}`}>
                        Buka Seluruh Materi Modul {module.order}
                        <ArrowRight className="size-3.5" aria-hidden="true" />
                      </Link>
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* 3. Learning Summary Telemetry */}
      <section aria-labelledby="learning-summary-heading" className="space-y-4">
        <div data-motion="header">
          <h2 id="learning-summary-heading" className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Ringkasan Kemajuan Akun
          </h2>
          <p className="text-xs text-text-secondary sm:text-sm">
            Tinjauan lengkap materi yang telah diselesaikan pada profil akunmu.
          </p>
        </div>
        <LearningSummary {...progress} />
      </section>
    </DashboardMotionSection>
  );
}
