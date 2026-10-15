import { FolderOpen, BookOpen, ListChecks, Award } from "lucide-react";
import { Card } from "@/components/ui/card";

interface OverviewKpiGridProps {
  projectCount: number;
  completedLessons: number;
  totalLessons: number;
  completedChallenges: number;
  totalChallenges: number;
  skillCount: number;
  isOffline?: boolean;
  progressUnavailable?: boolean;
}

export function OverviewKpiGrid({
  projectCount,
  completedLessons,
  totalLessons,
  completedChallenges,
  totalChallenges,
  skillCount,
  isOffline = false,
  progressUnavailable = false,
}: OverviewKpiGridProps) {
  const percentComplete = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const kpis = [
    {
      title: "Proyek terbaru",
      value: isOffline ? "—" : `${projectCount} Proyek`,
      subtitle: isOffline ? "Daftar akun gagal dimuat" : projectCount > 0 ? "Siap dilanjutkan" : "Mulai sirkuit baru",
      icon: FolderOpen,
      accent: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Materi Selesai",
      value: progressUnavailable ? "—" : `${completedLessons}/${totalLessons} Materi`,
      subtitle: progressUnavailable ? "Progres belum dapat dimuat" : `${percentComplete}% Kurikulum tuntas`,
      icon: BookOpen,
      accent: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      title: "Evaluasi Tantangan",
      value: progressUnavailable ? "—" : `${completedChallenges}/${totalChallenges} Terpenuhi`,
      subtitle: progressUnavailable ? "Progres belum dapat dimuat" : completedChallenges > 0 ? "Verifikasi deterministik" : "Uji di Virtual Lab",
      icon: ListChecks,
      accent: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      title: "Topik kurikulum",
      value: `${skillCount} Topik`,
      subtitle: "Cakupan materi yang tersedia",
      icon: Award,
      accent: "text-cyan-500",
      bg: "bg-cyan-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3.5 sm:gap-4 lg:grid-cols-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <Card
            key={kpi.title}
            data-motion="kpi"
            className="flex flex-col justify-between p-4.5 sm:p-5 shadow-xs border-border/70 hover:border-border transition-colors"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                {kpi.title}
              </span>
              <div className={`flex size-8 shrink-0 items-center justify-center rounded-md ${kpi.bg}`}>
                <Icon className={`size-4 shrink-0 ${kpi.accent}`} aria-hidden="true" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                {kpi.value}
              </p>
              <p className="mt-1 text-xs text-text-secondary truncate">
                {kpi.subtitle}
              </p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
