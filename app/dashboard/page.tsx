import Link from "next/link";
import type { Metadata } from "next";
import { dashboardIdentity, dashboardProjects } from "@/features/dashboard/server";
import { NewProjectAction } from "@/features/dashboard/ui/new-project-action";
import { ProjectCollection } from "@/features/dashboard/ui/project-collection";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import { progressForPage } from "@/features/progress/server";
import { LearningSummary } from "@/features/progress/ui/learning-summary";
import { ContinueLearning } from "@/features/progress/ui/continue-learning";
import { PendingChallenges } from "@/features/challenges/ui/pending-challenges";

export const metadata: Metadata = { title: "Dashboard" };
export default async function DashboardPage() {
  const user = await dashboardIdentity();
  const result = await dashboardProjects({ page: 1 }, 6);
  const progress = await progressForPage();
  return <>
    <section className="flex flex-wrap items-start justify-between gap-5"><div className="min-w-0"><p className="mb-2 text-sm text-text-secondary">Dashboard</p><h1 className="break-words text-2xl font-semibold tracking-tight sm:text-3xl">Halo, {user.name}</h1><p className="mt-3 text-sm text-text-secondary">Lanjutkan ide terakhirmu atau mulai rangkaian baru.</p></div><NewProjectAction /></section>
    <section aria-labelledby="learning-entry" className="flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-surface p-5"><div className="flex items-start gap-3"><BookOpen aria-hidden className="mt-1 size-5 shrink-0 text-primary" /><div><h2 id="learning-entry" className="font-semibold">Mulai belajar IoT</h2><p className="mt-2 text-sm text-text-secondary">Dari elektronika dasar sampai Traffic Light, belajar lewat praktik di Virtual Lab.</p></div></div><Button asChild variant="outline"><Link href="/dashboard/learn">Buka Belajar</Link></Button></section>
    <section aria-labelledby="recent-projects" className="space-y-5"><div className="flex flex-wrap items-center justify-between gap-2"><h2 id="recent-projects" className="text-lg font-semibold">Proyek terbaru</h2><Button asChild variant="ghost"><Link href="/dashboard/projects">Lihat semua proyek</Link></Button></div><ProjectCollection {...result} owner={user.id} /></section>
    <PendingChallenges key={user.id} owner={user.id} />
    <div className="grid gap-5 md:grid-cols-2"><ContinueLearning rows={progress.rows} /><LearningSummary {...progress} /></div>
  </>;
}
