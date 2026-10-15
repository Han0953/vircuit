import type { Metadata } from "next";
import { dashboardGuard } from "@/features/dashboard/server";
import { DashboardCirra } from "@/features/ai/ui/dashboard-cirra";

export const metadata: Metadata = { title: "Cirra — Vircuit", description: "Tanya Cirra tentang elektronika, pemrograman, dan ide proyek IoT." };

export default async function CirraPage() {
  const { user } = await dashboardGuard();
  return <DashboardCirra key={user.id} owner={user.id} />;
}
