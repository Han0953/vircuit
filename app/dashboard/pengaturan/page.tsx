import type { Metadata } from "next";
import { dashboardGuard, dashboardIdentity } from "@/features/dashboard/server";
import { accountInformation } from "@/features/settings/contracts";
import { SettingsWorkspace } from "@/features/settings/ui/settings-workspace";

export const metadata: Metadata = { title: "Pengaturan", description: "Kelola profil, keamanan, dan preferensi Vircuit." };
export default async function SettingsPage() {
  const [identity, { user }] = await Promise.all([dashboardIdentity(), dashboardGuard()]);
  return <SettingsWorkspace key={user.id} user={identity} account={accountInformation(user)} />;
}
