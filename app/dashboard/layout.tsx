import type { ReactNode } from "react";
import { dashboardIdentity } from "@/features/dashboard/server";
import { DashboardShell } from "@/features/dashboard/ui/dashboard-shell";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await dashboardIdentity();
  return <DashboardShell user={user}>{children}</DashboardShell>;
}
