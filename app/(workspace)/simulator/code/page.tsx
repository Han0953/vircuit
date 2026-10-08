import { verifyWorkspaceAccess } from "@/features/projects/server/workspace-access";
export const metadata = { title: "Code · Virtual Lab" };
export default async function CodePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return verifyWorkspaceAccess(searchParams, "/simulator/code");
}
