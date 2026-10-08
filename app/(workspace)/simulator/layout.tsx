import { Suspense, type ReactNode } from "react";
import { WorkspaceShell } from "@/features/simulator/ui/workspace/workspace-shell";
export default function SimulatorLayout({ children }: { children: ReactNode }) {
  return <>{children}<Suspense fallback={<p className="p-6" role="status">Memuat Virtual Lab…</p>}><WorkspaceShell /></Suspense></>;
}
