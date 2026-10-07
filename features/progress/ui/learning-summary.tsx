import Link from "next/link";
import { deriveProgress } from "../derive";
import { ProgressError } from "./progress-error";
import type { ProgressRow } from "../contracts";
export function LearningSummary({ rows, error }: { rows: ProgressRow[] | null; error: string | null }) {
  if (!rows) return <ProgressError message={error ?? "Progress belum tersedia."} />;
  const data = deriveProgress(rows);
  return <section aria-label="Progress belajar" className="space-y-4 rounded-lg border bg-surface p-5"><h2 className="text-lg font-semibold">Progress belajar</h2><p className="text-sm text-text-secondary">{data.completed} dari {data.total} materi selesai</p><progress aria-label="Materi selesai" className="h-2 w-full accent-primary" max={data.total} value={data.completed} /><ul className="space-y-2 text-sm">{data.courses.map(({ course, completed, total }) => <li key={course.id} className="flex flex-wrap justify-between gap-2"><Link href={`/dashboard/learn/${course.slug}`} className="text-primary underline">{course.title}</Link><span>{completed}/{total}</span></li>)}</ul><Link href="/dashboard/progress" className="inline-flex min-h-11 items-center text-sm text-primary underline">Lihat perkembangan</Link></section>;
}
