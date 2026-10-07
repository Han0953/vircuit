import Link from "next/link";
import { notFound } from "next/navigation";
import { dashboardIdentity } from "@/features/dashboard/server";
import { findCourse, lessonHref } from "@/features/learning/registry";
import { CourseOutline } from "@/features/learning/ui/course-outline";
import { Button } from "@/components/ui/button";
export default async function CoursePage({ params }: { params: Promise<{ course: string }> }) {
  await dashboardIdentity();
  const course = findCourse((await params).course);
  if (!course) notFound();
  return <>
    <nav aria-label="Breadcrumb" className="text-sm"><Link href="/dashboard/learn" className="text-primary underline">Belajar</Link></nav>
    <header className="max-w-2xl space-y-3"><p className="text-sm text-text-secondary">Pemula · {course.lessons.length} lesson</p><h1 className="text-3xl font-semibold">{course.title}</h1><p className="leading-relaxed text-text-secondary">{course.description}</p><p className="text-sm text-text-secondary">Urutan ini adalah panduan, bukan persyaratan kelulusan. Perkiraan durasi mencakup membaca dan mencoba.</p><Button asChild><Link href={lessonHref(course, course.lessons[0])}>Mulai lesson pertama</Link></Button></header>
    <div className="max-w-3xl rounded-lg border bg-surface p-5 sm:p-6"><CourseOutline course={course} /></div>
  </>;
}
