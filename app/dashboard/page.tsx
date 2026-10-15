import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RequestError } from "@/lib/request-security";
import { ArrowRight, CircuitBoard, Cpu, ListChecks, Sparkles } from "lucide-react";
import { dashboardIdentity, dashboardProjects } from "@/features/dashboard/server";
import { NewProjectAction } from "@/features/dashboard/ui/new-project-action";
import { ProjectCollection } from "@/features/dashboard/ui/project-collection";
import { OverviewKpiGrid } from "@/features/dashboard/ui/overview-kpi-grid";
import { DashboardMotionSection } from "@/features/dashboard/motion/dashboard-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { progressForPage } from "@/features/progress/server";
import { deriveProgress } from "@/features/progress/derive";
import { LearningSummary } from "@/features/progress/ui/learning-summary";
import { ContinueLearning } from "@/features/progress/ui/continue-learning";
import { PendingChallenges } from "@/features/challenges/ui/pending-challenges";
import { challengeCatalog } from "@/features/challenges/registry";
import { PracticeLaunchAction } from "@/features/learning/ui/practice-launch-action";
import { GuestDraftNotice } from "@/features/projects/ui/guest-draft-notice";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Command Center eksperimen sirkuit IoT dan Virtual Laboratory Vircuit.",
};

export default async function DashboardPage() {
  const [user, result, progress] = await Promise.all([
    dashboardIdentity(), dashboardProjects({ page: 1 }, 6), progressForPage(),
  ]).catch((error: unknown) => {
    // The session may expire while independent queries are in flight.
    if (error instanceof RequestError && error.status === 401) redirect("/masuk?next=/dashboard");
    throw error;
  });

  const challenges = challengeCatalog();
  const rows = progress.rows ?? [];
  const derived = deriveProgress(rows);

  // Determine completed challenges based on verified lesson completion in rows
  const completedChallengeCount = challenges.filter((c) =>
    rows.some((r) => r.lesson_id === c.lessonId && r.status === "completed")
  ).length;

  // Next spotlight challenge
  const nextChallenge =
    challenges.find(
      (c) => !rows.some((r) => r.lesson_id === c.lessonId && r.status === "completed")
    ) ?? challenges[0];

  const projectItems = result.data?.items ?? [];
  const isOffline = !!result.error;

  return (
    <DashboardMotionSection className="space-y-8 sm:space-y-10">
      {/* 1. Command Center Hero Section */}
      <section className="flex flex-col justify-between gap-5 border-b border-border/50 pb-6 sm:flex-row sm:items-center">
        <div className="space-y-2">
          <div className="flex items-center gap-2" data-motion="header">
            <Badge variant="outline" className="gap-1.5 font-mono text-[11px] font-semibold text-primary border-primary/30 bg-primary/5">
              <span className="size-1.5 rounded-full bg-primary animate-pulse" />
              COMMAND CENTER
            </Badge>
            <span className="text-xs text-text-tertiary">· IoT Virtual Lab</span>
          </div>
          <h1
            data-motion="header"
            className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl"
          >
            Halo, {user.name}!
          </h1>
          <p
            data-motion="header"
            className="max-w-2xl text-sm leading-relaxed text-text-secondary sm:text-base"
          >
            Pusat kendali eksperimen IoT: lanjutkan rangkaian terakhir, uji tantangan sirkuit, atau mulai skematik baru.
          </p>
        </div>

        <div data-motion="action" className="flex flex-wrap items-center gap-2.5 shrink-0">
          <NewProjectAction />
          <Button asChild variant="outline" className="gap-2">
            <Link href="/simulator">
              <CircuitBoard className="size-4 text-primary" aria-hidden="true" />
              Buka Lab
            </Link>
          </Button>
          <GuestDraftNotice />
        </div>
      </section>

      {/* 2. Telemetry KPI Grid */}
      <section aria-labelledby="telemetry-heading" className="space-y-3">
        <h2 id="telemetry-heading" className="sr-only">
          Statistik Eksperimen
        </h2>
        <OverviewKpiGrid
          projectCount={projectItems.length}
          completedLessons={derived.completed}
          totalLessons={derived.total}
          completedChallenges={completedChallengeCount}
          totalChallenges={challenges.length}
          skillCount={derived.skills.length}
          isOffline={isOffline}
          progressUnavailable={!progress.rows}
        />
      </section>

      {/* 3. Dual Spotlight Section: Continue Learning & Challenge Spotlight */}
      <section className="grid gap-5 md:grid-cols-2">
        {/* Continue Learning Spotlight */}
        {progress.rows ? (
          <ContinueLearning rows={progress.rows} />
        ) : (
          <Card data-motion="card" className="p-5 sm:p-6 shadow-xs border-border/70 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Sparkles className="size-4" aria-hidden="true" />
                </span>
                <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                  Materi belajar
                </span>
              </div>
              <h3 className="mt-3 text-lg font-bold text-foreground">
                Dasar IoT dengan Arduino Uno
              </h3>
              <p className="mt-2 text-sm text-text-secondary">
                Pelajari elektronika dasar, digital I/O, sensor analog, hingga proyek lampu lalu lintas melalui eksperimen langsung.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-border/50">
              <Button asChild size="sm" className="gap-1.5 font-medium">
                <Link href="/dashboard/learn">
                  Buka Jalur Belajar
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </Card>
        )}

        {/* Challenge Arena Spotlight */}
        <Card
          data-motion="card"
          className="flex flex-col justify-between p-5 sm:p-6 shadow-xs border-border/70 hover:border-border transition-colors"
        >
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-md bg-amber-500/10 text-amber-500">
                  <ListChecks className="size-4 shrink-0" aria-hidden="true" />
                </span>
                <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                  Arena Tantangan Siaga
                </span>
              </div>
              <Badge variant="outline" className="text-[10px] font-semibold text-amber-500 border-amber-500/30">
                Tantangan #{nextChallenge.order}
              </Badge>
            </div>

            <h3 className="mt-3 text-lg font-bold tracking-tight text-foreground sm:text-xl">
              {nextChallenge.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">
              {nextChallenge.objective}
            </p>

            <div className="mt-3.5 flex flex-wrap gap-1.5">
              {nextChallenge.skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="text-[10px] font-medium">
                  {skill}
                </Badge>
              ))}
              <Badge variant="outline" className="text-[10px] font-mono">
                <Cpu className="size-3 mr-1 text-primary" aria-hidden="true" />
                Arduino Uno
              </Badge>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-border/50 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-text-tertiary">
              Evaluator deterministik
            </span>
            <div className="flex items-center gap-2">
              <PracticeLaunchAction lessonId={nextChallenge.lessonId} challenge />
            </div>
          </div>
        </Card>
      </section>

      {/* 4. Recent Projects Workspace Section */}
      <section aria-labelledby="recent-projects-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2" data-motion="header">
          <div>
            <h2 id="recent-projects-heading" className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
              Proyek Terbaru
            </h2>
            <p className="text-xs text-text-secondary">
              Proyek akun yang terakhir diperbarui.
            </p>
          </div>
          <Button asChild variant="ghost" size="sm" className="gap-1.5 text-xs font-medium text-primary">
            <Link href="/dashboard/projects">
              Lihat semua proyek
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </Button>
        </div>

        <ProjectCollection {...result} owner={user.id} />
      </section>

      {/* 5. Pending Unsynced Challenges if any exist */}
      <PendingChallenges key={user.id} owner={user.id} />

      {/* 6. Learning Progress Telemetry */}
      {progress.rows && (
        <section aria-labelledby="summary-heading" className="space-y-4">
          <div data-motion="header">
            <h2 id="summary-heading" className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
              Rincian Kurikulum Belajar
            </h2>
            <p className="text-xs text-text-secondary">
              Progres per modul dari materi resmi yang telah diselesaikan.
            </p>
          </div>
          <LearningSummary {...progress} />
        </section>
      )}
    </DashboardMotionSection>
  );
}
