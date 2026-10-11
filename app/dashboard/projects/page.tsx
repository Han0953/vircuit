import type { Metadata } from "next";
import { FolderOpen } from "lucide-react";
import { dashboardIdentity, dashboardProjects } from "@/features/dashboard/server";
import { NewProjectAction } from "@/features/dashboard/ui/new-project-action";
import { ProjectCollection } from "@/features/dashboard/ui/project-collection";
import { DashboardMotionSection } from "@/features/dashboard/motion/dashboard-motion";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Proyek Saya",
  description: "Manajemen proyek sirkuit dan kode eksperimen IoT di Vircuit.",
};

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const query = await searchParams;
  const user = await dashboardIdentity();
  const result = await dashboardProjects(query);

  const projectCount = result.data?.items.length ?? 0;

  return (
    <DashboardMotionSection className="space-y-8 sm:space-y-10">
      {/* Workspace Header */}
      <section className="flex flex-col justify-between gap-5 border-b border-border/50 pb-6 sm:flex-row sm:items-center">
        <div className="space-y-2">
          <div className="flex items-center gap-2" data-motion="header">
            <Badge variant="outline" className="gap-1.5 font-mono text-[11px] font-semibold text-blue-500 border-blue-500/30 bg-blue-500/5">
              <FolderOpen className="size-3" />
              RUANG KERJA SIRKUIT
            </Badge>
            <span className="text-xs text-text-tertiary">
              · {projectCount} Proyek di Halaman Ini
            </span>
          </div>

          <h1
            data-motion="header"
            className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl"
          >
            Proyek Saya
          </h1>

          <p
            data-motion="header"
            className="max-w-2xl text-sm leading-relaxed text-text-secondary sm:text-base"
          >
            Kelola dan kembangkan seluruh sirkuit IoT yang tersimpan di akunmu. Setiap proyek mencakup skematik breadboard, wiring, dan kode C/C++ yang dapat langsung dilanjutkan di Virtual Lab.
          </p>
        </div>

        <div data-motion="action" className="shrink-0">
          <NewProjectAction />
        </div>
      </section>

      {/* Projects Collection & Search */}
      <ProjectCollection
        {...result}
        owner={user.id}
        search={typeof query.search === "string" ? query.search : ""}
        searchable
      />
    </DashboardMotionSection>
  );
}
