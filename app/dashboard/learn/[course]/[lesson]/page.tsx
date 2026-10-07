import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, ArrowLeft, ArrowRight } from "lucide-react";
import { dashboardIdentity } from "@/features/dashboard/server";
import { findCourse, lessonHref } from "@/features/learning/registry";
import { CourseOutline } from "@/features/learning/ui/course-outline";
import { LessonMenu } from "@/features/learning/ui/lesson-menu";
import { LessonContent } from "@/features/learning/ui/lesson-content";
import { PracticeLaunchAction } from "@/features/learning/ui/practice-launch-action";
import { Button } from "@/components/ui/button";
export default async function LessonPage({ params }: { params: Promise<{ course: string; lesson: string }> }) {
  await dashboardIdentity();
  const slugs = await params;
  const course = findCourse(slugs.course);
  const lesson = course?.lessons.find((l) => l.slug === slugs.lesson);
  if (!course || !lesson) notFound();
  const index = course.lessons.indexOf(lesson);
  const previous = course.lessons[index - 1]; const next = course.lessons[index + 1];
  return <>
    <nav aria-label="Breadcrumb" className="flex min-w-0 flex-wrap gap-x-2 gap-y-1 text-sm text-text-secondary"><Link href="/dashboard/learn" className="text-primary underline">Belajar</Link><span aria-hidden>/</span><Link href={`/dashboard/learn/${course.slug}`} className="min-w-0 break-words text-primary underline">{course.title}</Link><span aria-hidden>/</span><span aria-current="page" className="break-words">{lesson.title}</span></nav>
    <LessonMenu><CourseOutline course={course} active={lesson.id} /></LessonMenu>
    <div className="grid min-w-0 gap-8 xl:grid-cols-[14rem_minmax(0,1fr)]">
      <aside className="hidden self-start rounded-lg border bg-surface p-4 xl:block"><CourseOutline course={course} active={lesson.id} /></aside>
      <article className="min-w-0 max-w-[72ch] space-y-8">
        <header className="space-y-3"><p className="text-sm text-primary">{course.modules.find((m) => m.id === lesson.moduleId)?.title} · Lesson {lesson.order}</p><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{lesson.title}</h1><p className="leading-relaxed text-text-secondary">{lesson.summary}</p><p className="flex items-center gap-2 text-sm text-text-secondary"><Clock aria-hidden className="size-4" />Sekitar {lesson.duration} menit</p></header>
        <section aria-labelledby="lesson-objectives" className="space-y-3 rounded-lg border bg-surface p-5"><h2 id="lesson-objectives" className="font-semibold">Tujuan belajar</h2><ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed">{lesson.objectives.map((objective) => <li key={objective}>{objective}</li>)}</ul></section>
        <section aria-label="Materi lesson"><LessonContent blocks={lesson.blocks} /></section>
        <section aria-labelledby="lesson-concepts" className="space-y-3"><h2 id="lesson-concepts" className="text-lg font-semibold">Konsep utama</h2><ul className="list-disc space-y-2 pl-5 leading-relaxed">{lesson.concepts.map((concept) => <li key={concept}>{concept}</li>)}</ul></section>
        {lesson.practice && <section aria-labelledby="practice-heading" className="space-y-4 rounded-lg border bg-surface p-5"><h2 id="practice-heading" className="text-lg font-semibold">Praktik di Virtual Lab</h2><p className="leading-relaxed">{lesson.practice.goal}</p><p className="text-sm text-text-secondary">Komponen: {lesson.practice.components.join(", ")}</p><ol className="space-y-3 text-sm leading-relaxed">{lesson.practice.instructions.map((instruction, i) => <li key={i}><span className="font-semibold">{instruction.phase}:</span> {instruction.text}</li>)}</ol><h3 className="font-semibold">Pengamatan yang diharapkan</h3><ul className="list-disc space-y-2 pl-5 text-sm">{lesson.practice.observations.map((text) => <li key={text}>{text}</li>)}</ul><p className="text-xs text-text-secondary">Membuka praktik memerlukan konfirmasi. Project aktif dibackup sebelum template dibuka.</p><PracticeLaunchAction lessonId={lesson.id} /></section>}
        <nav aria-label="Navigasi lesson" className="flex flex-wrap justify-between gap-3 border-t pt-5">{previous ? <Button asChild variant="outline"><Link href={lessonHref(course, previous)}><ArrowLeft aria-hidden />Sebelumnya<span className="sr-only">: {previous.title}</span></Link></Button> : <span />}{next ? <Button asChild variant="outline"><Link href={lessonHref(course, next)}>Berikutnya<ArrowRight aria-hidden /><span className="sr-only">: {next.title}</span></Link></Button> : <Button asChild variant="outline"><Link href={`/dashboard/learn/${course.slug}`}>Kembali ke jalur belajar</Link></Button>}</nav>
      </article>
    </div>
  </>;
}
