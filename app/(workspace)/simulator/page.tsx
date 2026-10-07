import type { Metadata } from "next";
import { WorkspaceShell } from "@/features/simulator/ui/workspace/workspace-shell";
import { redirect } from "next/navigation";
import { authenticatedClient } from "@/features/projects/server/service";
import { RequestError } from "@/lib/request-security";
import { safeDestination } from "@/features/auth/redirect";

export const metadata: Metadata = {
  title: "Virtual Lab",
  description: "Workspace Vircuit untuk menjelajahi ruang kerja rangkaian sebagai tamu.",
};

export default async function SimulatorPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  if (params.lesson !== undefined || params.practice !== undefined) {
    try { await authenticatedClient(true); }
    catch (error) {
      if (!(error instanceof RequestError && error.status === 401)) throw error;
      const query = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) if (typeof value === "string") query.set(key, value);
      redirect(`/masuk?next=${encodeURIComponent(safeDestination(`/simulator?${query}`))}`);
    }
  }
  return <WorkspaceShell />;
}
