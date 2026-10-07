import Link from "next/link";
import { lessonHref } from "../registry";
import type { Course } from "../schema";
export function CourseOutline({ course, active }: { course: Course; active?: string }) {
  return <nav aria-label="Daftar lesson" className="space-y-5">{course.modules.map((module) => <section key={module.id} id={module.id} className="space-y-2"><h2 className="text-sm font-semibold">{module.order}. {module.title}</h2><ol className="space-y-1">{course.lessons.filter((l) => l.moduleId === module.id).map((lesson) => <li key={lesson.id}><Link href={lessonHref(course, lesson)} aria-current={active === lesson.id ? "page" : undefined} className={`flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring ${active === lesson.id ? "bg-primary-soft text-primary" : "text-text-secondary hover:bg-surface-muted"}`}><span className="shrink-0 tabular-nums">{lesson.order}.</span><span className="min-w-0 break-words">{lesson.title}</span></Link></li>)}</ol></section>)}</nav>;
}
