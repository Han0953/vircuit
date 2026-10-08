import { verifyWorkspaceAccess } from "@/features/projects/server/workspace-access";
export const metadata = { title: "Virtual Lab", description: "Rangkai dan simulasikan project IoT." };
export default async function SimulatorPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return verifyWorkspaceAccess(searchParams, "/simulator");
}
