import { Suspense, type ReactNode } from "react";
import { cookies } from "next/headers";
import { sidebarPreference } from "@/features/dashboard/navigation";
import { authEntryCookie, parseAuthEntry } from "@/features/auth/motion/transition-contract";
import { dashboardGuard, dashboardIdentity } from "@/features/dashboard/server";
import { DashboardShell } from "@/features/dashboard/ui/dashboard-shell";

async function AuthenticatedShell({ children }: { children: ReactNode }) {
  const user = await dashboardIdentity();
  const jar = await cookies();
  return <DashboardShell key={user.id} user={user} initialSidebar={sidebarPreference(jar.get("vircuit-sidebar")?.value, user.id)} authEntry={parseAuthEntry(jar.get(authEntryCookie)?.value)}>{children}</DashboardShell>;
}
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  await dashboardGuard();
  return <Suspense fallback={<main className="min-h-dvh bg-background px-6 pt-24"><p role="status">Menyiapkan ruang belajar…</p><div aria-hidden className="mt-6 h-40 rounded-xl bg-surface-muted" /></main>}><AuthenticatedShell>{children}</AuthenticatedShell></Suspense>;
}
