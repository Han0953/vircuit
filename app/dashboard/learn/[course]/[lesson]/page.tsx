import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Clock, ArrowLeft, ArrowRight } from "lucide-react";
import { dashboardIdentity } from "@/features/dashboard/server";
import { findCourse, lessonHref } from "@/features/learning/registry";
import { CourseOutline } from "@/features/learning/ui/course-outline";
import { LessonMenu } from "@/features/learning/ui/lesson-menu";
import { LessonContent } from "@/features/learning/ui/lesson-content";
import { PracticeLaunchAction } from "@/features/learning/ui/practice-launch-action";
import { Button } from "@/components/ui/button";
import { progressForPage } from "@/features/progress/server";
import { LessonStatus } from "@/features/progress/ui/lesson-status";
import { LessonCirra } from "@/features/ai/ui/lesson-cirra";
import { BackButton } from "@/components/shared/back-button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ course: string; lesson: string }>;
}): Promise<Metadata> {
  const { course: courseSlug, lesson: lessonSlug } = await params;
  const course = findCourse(courseSlug);
  const lesson = course?.lessons.find((l) => l.slug === lessonSlug);
  if (!lesson) return { title: "Materi Belajar" };
  return {
    title: `${lesson.title} · ${course?.title ?? "Belajar"}`,
    description: lesson.summary,
  };
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ course: string; lesson: string }>;
}) {
  const user = await dashboardIdentity();
  const slugs = await params;
  const course = findCourse(slugs.course);
  const lesson = course?.lessons.find((l) => l.slug === slugs.lesson);
  if (!course || !lesson) notFound();
  const index = course.lessons.indexOf(lesson);
  const previous = course.lessons[index - 1];
  const next = course.lessons[index + 1];
  const progress = await progressForPage();

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 1. Top action bar with Back Button & Breadcrumb & Mobile Lesson Menu */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-4">
        <div className="flex items-center gap-3 min-w-0">
          <BackButton
            fallbackHref={`/dashboard/learn/${course.slug}`}
            label="Kembali"
            variant="outline"
            size="sm"
          />
          <span className="text-border hidden sm:inline" aria-hidden="true">
            /
          </span>
          <nav
            aria-label="Breadcrumb"
            className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm text-text-secondary"
          >
            <Link
              href="/dashboard/learn"
              className="text-primary underline hover:text-primary/80 transition-colors"
            >
              Belajar
            </Link>
            <span aria-hidden="true">/</span>
            <Link
              href={`/dashboard/learn/${course.slug}`}
              className="min-w-0 break-words text-primary underline hover:text-primary/80 transition-colors"
            >
              {course.title}
            </Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page" className="break-words text-foreground font-medium">
              {lesson.title}
            </span>
          </nav>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <LessonMenu>
            <CourseOutline course={course} active={lesson.id} rows={progress.rows} />
          </LessonMenu>
        </div>
      </div>

      {/* 2. Main Content Grid */}
      <div className="grid min-w-0 gap-8 xl:grid-cols-[14rem_minmax(0,1fr)]">
        <aside className="hidden self-start rounded-lg border bg-surface p-4 xl:block">
          <CourseOutline course={course} active={lesson.id} rows={progress.rows} />
        </aside>

        <article className="min-w-0 max-w-[72ch] space-y-8">
          <header className="space-y-3">
            <p className="text-sm text-primary">
              {course.modules.find((m) => m.id === lesson.moduleId)?.title} · Lesson {lesson.order}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {lesson.title}
            </h1>
            <p className="leading-relaxed text-text-secondary">{lesson.summary}</p>
            <p className="flex items-center gap-2 text-sm text-text-secondary">
              <Clock aria-hidden="true" className="size-4" />
              Sekitar {lesson.duration} menit
            </p>
          </header>

          <section
            aria-labelledby="lesson-objectives"
            className="space-y-3 rounded-lg border bg-surface p-5"
          >
            <h2 id="lesson-objectives" className="font-semibold">
              Tujuan belajar
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed">
              {lesson.objectives.map((objective) => (
                <li key={objective}>{objective}</li>
              ))}
            </ul>
          </section>

          <LessonStatus
            key={`${user.id}:${lesson.id}`}
            owner={user.id}
            lessonId={lesson.id}
            informational={!lesson.practice}
            row={progress.rows?.find((r) => r.lesson_id === lesson.id) ?? null}
          />

          <section aria-label="Materi lesson">
            <LessonContent blocks={lesson.blocks} />
          </section>

          <LessonCirra owner={user.id} lessonId={lesson.id} title={lesson.title} />

          <section aria-labelledby="lesson-concepts" className="space-y-3">
            <h2 id="lesson-concepts" className="text-lg font-semibold">
              Konsep utama
            </h2>
            <ul className="list-disc space-y-2 pl-5 leading-relaxed">
              {lesson.concepts.map((concept) => (
                <li key={concept}>{concept}</li>
              ))}
            </ul>
          </section>

          {lesson.practice && (
            <section
              aria-labelledby="practice-heading"
              className="space-y-4 rounded-lg border bg-surface p-5"
            >
              <h2 id="practice-heading" className="text-lg font-semibold">
                Praktik di Virtual Lab
              </h2>
              <p className="leading-relaxed">{lesson.practice.goal}</p>
              <p className="text-sm text-text-secondary">
                Komponen: {lesson.practice.components.join(", ")}
              </p>
              <ol className="space-y-3 text-sm leading-relaxed">
                {lesson.practice.instructions.map((instruction, i) => (
                  <li key={i}>
                    <span className="font-semibold">{instruction.phase}:</span> {instruction.text}
                  </li>
                ))}
              </ol>
              <h3 className="font-semibold">Pengamatan yang diharapkan</h3>
              <ul className="list-disc space-y-2 pl-5 text-sm">
                {lesson.practice.observations.map((text) => (
                  <li key={text}>{text}</li>
                ))}
              </ul>
              <p className="text-xs text-text-secondary">
                Membuka praktik memerlukan konfirmasi. Project aktif dibackup sebelum template dibuka.
              </p>
              <PracticeLaunchAction lessonId={lesson.id} />
            </section>
          )}

          <nav
            aria-label="Navigasi lesson"
            className="flex flex-wrap justify-between gap-3 border-t pt-5"
          >
            {previous ? (
              <Button asChild variant="outline">
                <Link href={lessonHref(course, previous)}>
                  <ArrowLeft aria-hidden="true" />
                  Sebelumnya
                  <span className="sr-only">: {previous.title}</span>
                </Link>
              </Button>
            ) : (
              <BackButton
                fallbackHref={`/dashboard/learn/${course.slug}`}
                variant="outline"
                label="Kembali ke Silabus"
              />
            )}
            {next ? (
              <Button asChild variant="outline">
                <Link href={lessonHref(course, next)}>
                  Berikutnya
                  <ArrowRight aria-hidden="true" />
                  <span className="sr-only">: {next.title}</span>
                </Link>
              </Button>
            ) : (
              <BackButton
                fallbackHref={`/dashboard/learn/${course.slug}`}
                variant="outline"
                label="Kembali ke jalur belajar"
              />
            )}
          </nav>

          {lesson.practice && (
            <section
              aria-label="Tantangan lesson"
              className="space-y-3 rounded-md border p-5"
            >
              <h2 className="font-semibold">Uji hasil praktik</h2>
              <p className="text-sm text-text-secondary">
                Penuhi tujuan tantangan untuk menyelesaikan materi. Jika praktik ini sedang aktif, rangkaianmu dipakai kembali.
              </p>
              <PracticeLaunchAction lessonId={lesson.id} challenge />
            </section>
          )}
        </article>
      </div>
    </div>
  );
}
