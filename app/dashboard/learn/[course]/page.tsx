import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight, BookOpen, Cpu, Layers } from "lucide-react";
import { dashboardIdentity } from "@/features/dashboard/server";
import { findCourse, lessonHref } from "@/features/learning/registry";
import { CourseOutline } from "@/features/learning/ui/course-outline";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { progressForPage } from "@/features/progress/server";
import { ProgressError } from "@/features/progress/ui/progress-error";
import { DashboardMotionSection } from "@/features/dashboard/motion/dashboard-motion";
import { BackButton } from "@/components/shared/back-button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ course: string }>;
}): Promise<Metadata> {
  const { course: slug } = await params;
  const course = findCourse(slug);
  if (!course) return { title: "Kurikulum Belajar" };
  return {
    title: `${course.title} · Belajar`,
    description: course.description,
  };
}

export default async function CoursePage({
  params,
}: {
  params: Promise<{ course: string }>;
}) {
  await dashboardIdentity();
  const { course: slug } = await params;
  const course = findCourse(slug);
  if (!course) notFound();
  const progress = await progressForPage();

  return (
    <DashboardMotionSection className="space-y-6 sm:space-y-8">
      {/* 1. Navigation bar with Back Button & Breadcrumb */}
      <div
        data-motion="header"
        className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-4"
      >
        <div className="flex items-center gap-3">
          <BackButton
            fallbackHref="/dashboard/learn"
            label="Kembali ke Belajar"
            variant="outline"
            size="sm"
          />
          <span className="text-border hidden sm:inline" aria-hidden="true">
            /
          </span>
          <nav
            aria-label="Breadcrumb"
            className="hidden sm:flex items-center gap-1.5 text-xs text-text-secondary font-medium"
          >
            <Link
              href="/dashboard/learn"
              className="text-primary hover:underline transition-colors"
            >
              Belajar
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-foreground font-semibold truncate max-w-[200px] sm:max-w-xs">
              {course.title}
            </span>
          </nav>
        </div>

        <Badge variant="outline" className="text-xs font-mono font-medium">
          {course.lessons.length} Total Materi
        </Badge>
      </div>

      {/* 2. Course Header Banner */}
      <header className="relative overflow-hidden rounded-2xl border border-border/80 bg-surface p-6 sm:p-8 lg:p-10 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center gap-2" data-motion="header">
          <Badge
            variant="outline"
            className="gap-1.5 font-mono text-[11px] font-semibold text-primary border-primary/30 bg-primary/5"
          >
            <span className="size-1.5 rounded-full bg-primary" />
            JALUR BELAJAR
          </Badge>
          <Badge variant="secondary" className="text-[11px] font-medium">
            Pemula · {course.lessons.length} lesson
          </Badge>
          <Badge variant="outline" className="gap-1 text-[11px] font-mono">
            <Cpu className="size-3 text-primary" aria-hidden="true" />
            Arduino Uno R3
          </Badge>
        </div>

        <h1
          data-motion="header"
          className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl"
        >
          {course.title}
        </h1>

        <p
          data-motion="header"
          className="max-w-3xl text-sm leading-relaxed text-text-secondary sm:text-base"
        >
          {course.description}
        </p>

        <p data-motion="header" className="text-xs text-text-tertiary">
          Urutan ini adalah panduan, bukan persyaratan kelulusan. Perkiraan durasi mencakup membaca dan mencoba.
        </p>

        <div data-motion="action" className="flex flex-wrap items-center gap-3 pt-2">
          <Button asChild size="default" className="gap-2 font-medium">
            <Link href={lessonHref(course, course.lessons[0])}>
              Mulai lesson pertama
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
          <div className="flex items-center gap-3 text-xs text-text-tertiary">
            <span className="flex items-center gap-1">
              <Layers className="size-3.5" aria-hidden="true" />
              {course.modules.length} Modul
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <BookOpen className="size-3.5" aria-hidden="true" />
              {course.lessons.length} Materi Praktik
            </span>
          </div>
        </div>

        {/* Decorative blueprint glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 size-80 rounded-full bg-primary/5 blur-3xl"
        />
      </header>

      {progress.error && <ProgressError message={progress.error} />}

      {/* 3. Course Outline Syllabus Section */}
      <section aria-labelledby="outline-heading" className="space-y-4">
        <div data-motion="header">
          <h2
            id="outline-heading"
            className="text-xl font-bold tracking-tight text-foreground sm:text-2xl"
          >
            Daftar Silabus & Modul
          </h2>
          <p className="text-xs text-text-secondary sm:text-sm">
            Pelajari setiap materi secara berurutan dan coba simulasi rangkaian di Virtual Lab.
          </p>
        </div>

        <Card
          data-motion="card"
          className="max-w-4xl rounded-xl border border-border/80 bg-surface p-5 sm:p-7 shadow-xs"
        >
          <CourseOutline course={course} rows={progress.rows} />
        </Card>
      </section>
    </DashboardMotionSection>
  );
}
