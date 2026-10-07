import Link from "next/link";
import { lessonHref } from "../registry";
import type { Course } from "../schema";
import type { ProgressRow } from "@/features/progress/contracts";
export function CourseOutline({ course, active, rows }: { course: Course; active?: string; rows?: ProgressRow[] | null }) {
  return <nav aria-label="Daftar lesson" className="space-y-5">{course.modules.map((module) => <section key={module.id} id={module.id} className="space-y-2">
    <h2 className="text-sm font-semibold">{module.order}. {module.title}</h2>
    <ol className="space-y-1">{course.lessons.filter((l) => l.moduleId === module.id).map((lesson) => {
      const status = rows?.find((r) => r.lesson_id === lesson.id && r.course_id === course.id)?.status;
      return <li key={lesson.id}><Link href={lessonHref(course, lesson)} aria-current={active === lesson.id ? "page" : undefined} className={`flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring ${active === lesson.id ? "bg-primary-soft text-primary" : "text-text-secondary hover:bg-surface-muted"}`}><span className="shrink-0 tabular-nums">{lesson.order}.</span><span className="min-w-0 break-words">{lesson.title}{rows && <span className="mt-1 block text-xs">{status === "completed" ? "Selesai" : status === "in_progress" ? "Sedang dipelajari" : "Belum dimulai"}</span>}</span></Link></li>;
    })}</ol>
  </section>)}</nav>;
}
