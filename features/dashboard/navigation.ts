import { BookOpen, ChartNoAxesColumn, CircuitBoard, FolderOpen, LayoutDashboard, ListChecks, Settings2 } from "lucide-react";

export const dashboardLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/learn", label: "Belajar", icon: BookOpen },
  { href: "/simulator", label: "Virtual Lab", icon: CircuitBoard },
  { href: "/dashboard/projects", label: "Proyek Saya", icon: FolderOpen },
  { href: "/dashboard/challenges", label: "Tantangan", icon: ListChecks },
  { href: "/dashboard/progress", label: "Progress", icon: ChartNoAxesColumn },
  { href: "/dashboard/pengaturan", label: "Pengaturan", icon: Settings2 },
] as const;
export function activeDashboardLink(pathname: string, href: string) { return pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`)); }
export const swipeRoutes = ["/dashboard", "/dashboard/learn", "/dashboard/projects"] as const;
export interface SwipeSample { dx: number; dy: number; elapsed: number; startX: number; width: number }
export function swipeDestination(pathname: string, sample: SwipeSample): string | null {
  const index = swipeRoutes.findIndex((route) => route === pathname);
  const { dx, dy, elapsed, startX, width } = sample;
  if (index < 0 || startX < 28 || startX > width - 28 || Math.abs(dy) > 24 || Math.abs(dx) < Math.abs(dy) * 1.8) return null;
  if (Math.abs(dx) < 72 && !(Math.abs(dx) >= 40 && Math.abs(dx) / Math.max(1, elapsed) >= 0.45)) return null;
  return swipeRoutes[index + (dx < 0 ? 1 : -1)] ?? null;
}
export function sidebarPreference(raw: string | undefined, owner: string): "expanded" | "collapsed" {
  return raw === `${owner}:collapsed` ? "collapsed" : "expanded";
}
