import Link from "next/link";
import { dashboardIdentity } from "@/features/dashboard/server";
import { progressForPage } from "@/features/progress/server";
import { deriveProgress } from "@/features/progress/derive";
import { ProgressError } from "@/features/progress/ui/progress-error";
import { LearningSummary } from "@/features/progress/ui/learning-summary";
import { ContinueLearning } from "@/features/progress/ui/continue-learning";
import { CourseOutline } from "@/features/learning/ui/course-outline";
export const metadata = { title: "Progress belajar" };
export default async function ProgressPage() {
  await dashboardIdentity();
  const result = await progressForPage();
  if (!result.rows) return <><h1 className="text-2xl font-semibold">Progress belajar</h1><ProgressError message={result.error!} /></>;
  const data = deriveProgress(result.rows);
  return <><header className="space-y-3"><h1 className="text-2xl font-semibold">Progress belajar</h1><p className="text-sm text-text-secondary">Completion yang tersimpan di akunmu. Coverage menunjukkan materi yang selesai, bukan skor kemampuan.</p></header><div className="grid gap-5 md:grid-cols-2"><LearningSummary {...result} /><ContinueLearning rows={result.rows} /></div>
    {data.courses.map(({ course, modules }) => <section key={course.id} className="space-y-5 rounded-lg border bg-surface p-5"><h2 className="text-lg font-semibold"><Link href={`/dashboard/learn/${course.slug}`} className="text-primary underline">{course.title}</Link></h2><ul className="space-y-2 text-sm">{modules.map(({ module, completed, total }) => <li key={module.id} className="flex flex-wrap justify-between gap-2"><span>{module.title}</span><span>{completed}/{total} materi selesai</span></li>)}</ul><CourseOutline course={course} rows={result.rows} /></section>)}
    <section aria-label="Coverage keterampilan" className="space-y-4 rounded-lg border bg-surface p-5"><h2 className="text-lg font-semibold">Coverage keterampilan</h2><ul className="grid gap-4 sm:grid-cols-2">{data.skills.map((skill) => <li key={skill.name} className="space-y-2 text-sm"><p>{skill.name}: {skill.completed}/{skill.total} materi selesai</p><progress aria-label={skill.name} max={skill.total} value={skill.completed} className="h-2 w-full accent-primary" /></li>)}</ul></section>
  </>;
}
