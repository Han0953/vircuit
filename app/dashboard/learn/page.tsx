import Link from "next/link";
import { BookOpen, ArrowRight } from "lucide-react";
import { dashboardIdentity } from "@/features/dashboard/server";
import { learningCatalog } from "@/features/learning/registry";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
export const metadata = { title: "Belajar" };
export default async function LearningPage() {
  await dashboardIdentity();
  const courses = learningCatalog();
  return <>
    <header className="max-w-2xl space-y-3"><p className="text-sm text-primary">Learning Path</p><h1 className="text-3xl font-semibold">Belajar dengan praktik</h1><p className="leading-relaxed text-text-secondary">Pahami konsep, susun rangkaian, lalu uji ide di Virtual Lab. Ikuti urutan lesson sesuai kebutuhanmu.</p></header>
    {!courses.length ? <p className="rounded-lg border bg-surface p-6">Materi belum tersedia.</p> : <div className="grid gap-5 md:grid-cols-2">{courses.map((course) => <Card key={course.id} className="min-w-0 p-6 shadow-none"><div className="flex items-center justify-between gap-3"><BookOpen aria-hidden className="size-6 text-primary" /><Badge variant="secondary">Pemula</Badge></div><h2 className="text-xl font-semibold">{course.title}</h2><p className="text-sm leading-relaxed text-text-secondary">{course.description}</p><p className="text-sm text-text-secondary">{course.modules.length} module · {course.lessons.length} lesson</p><ol className="space-y-2 text-sm">{course.modules.map((module) => <li key={module.id}>{module.order}. {module.title}</li>)}</ol><Button asChild className="mt-2 self-start"><Link href={`/dashboard/learn/${course.slug}`}>Buka jalur belajar<ArrowRight aria-hidden /></Link></Button></Card>)}</div>}
  </>;
}
