import Link from "next/link";
import { dashboardIdentity } from "@/features/dashboard/server";
import { challengeCatalog } from "@/features/challenges/registry";
import { findLesson, lessonHref } from "@/features/learning/registry";
import { PracticeLaunchAction } from "@/features/learning/ui/practice-launch-action";
export default async function ChallengesPage() {
  await dashboardIdentity();
  return <><header><h1 className="text-2xl font-semibold">Tantangan</h1><p className="mt-3 text-text-secondary">Uji rangkaian dan program melalui skenario yang terukur.</p></header><div className="grid gap-4 md:grid-cols-2">{challengeCatalog().map((challenge) => {
    const found = findLesson(challenge.lessonId)!;
    return <article key={challenge.id} className="space-y-4 rounded-lg border bg-surface p-5"><h2 className="font-semibold">{challenge.title}</h2><p className="text-sm text-text-secondary">{challenge.objective}</p><Link className="block text-sm text-primary underline" href={lessonHref(found.course, found.lesson)}>Baca materi: {found.lesson.title}</Link><PracticeLaunchAction lessonId={challenge.lessonId} challenge /></article>;
  })}</div></>;
}
