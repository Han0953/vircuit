import type { Metadata } from "next";
import { WorkspaceShell } from "@/features/simulator/ui/workspace/workspace-shell";

export const metadata: Metadata = {
  title: "Virtual Lab",
  description: "Workspace Vircuit untuk menjelajahi ruang kerja rangkaian sebagai tamu.",
};

export default function SimulatorPage() {
  return <WorkspaceShell />;
}
