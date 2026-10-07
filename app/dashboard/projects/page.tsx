import type { Metadata } from "next";
import { dashboardIdentity, dashboardProjects } from "@/features/dashboard/server";
import { NewProjectAction } from "@/features/dashboard/ui/new-project-action";
import { ProjectCollection } from "@/features/dashboard/ui/project-collection";

export const metadata: Metadata = { title: "Proyek Saya" };
export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ search?: string; page?: string }> }) {
  const query = await searchParams;
  const user = await dashboardIdentity();
  const result = await dashboardProjects(query);
  return <><section className="flex flex-wrap items-start justify-between gap-5"><div><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Proyek Saya</h1><p className="mt-3 text-sm text-text-secondary">Proyek akunmu, diurutkan dari yang terakhir diperbarui.</p></div><NewProjectAction /></section><ProjectCollection {...result} owner={user.id} search={typeof query.search === "string" ? query.search : ""} searchable /></>;
}
