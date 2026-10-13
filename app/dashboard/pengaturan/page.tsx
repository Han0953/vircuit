import type { Metadata } from "next";
import { dashboardIdentity } from "@/features/dashboard/server";
import { authenticatedClient } from "@/features/projects/server/service";
import { accountInformation } from "@/features/settings/contracts";
import { SettingsWorkspace } from "@/features/settings/ui/settings-workspace";

export const metadata: Metadata = { title: "Pengaturan", description: "Kelola profil, keamanan, dan preferensi Vircuit." };
export default async function SettingsPage() {
  const identity = await dashboardIdentity();
  const { user } = await authenticatedClient(true);
  return <SettingsWorkspace key={user.id} user={identity} account={accountInformation(user)} />;
}
