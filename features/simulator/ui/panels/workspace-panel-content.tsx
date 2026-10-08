import { CircuitPanel } from "./circuit-panel";
import { ProblemsPanel, SerialPanel } from "./debug-panels";
import { CodePanel } from "./code-panel";
import { CircuitBoard, Code2, ListChecks, Sparkles, Terminal } from "lucide-react";
import { WorkspaceCirra } from "@/features/ai/ui/workspace-cirra";

export const workspaceTabs = [
  { id: "circuit", label: "Circuit", mobileLabel: "Circuit", icon: CircuitBoard },
  { id: "code", label: "Code", mobileLabel: "Code", icon: Code2 },
  { id: "serial", label: "Serial Monitor", mobileLabel: "Monitor", icon: Terminal },
  { id: "problems", label: "Problems", mobileLabel: "Problems", icon: ListChecks },
  { id: "ai", label: "Cirra", mobileLabel: "Cirra", icon: Sparkles },
] as const;

export type WorkspaceTab = (typeof workspaceTabs)[number]["id"];

export function isWorkspaceTab(value: string): value is WorkspaceTab {
  return workspaceTabs.some((tab) => tab.id === value);
}

export { PropertiesPanel } from "./properties-panel";

export function WorkspacePanelContent({ tab }: { tab: WorkspaceTab }) {
  switch (tab) {
    case "circuit":
      return <CircuitPanel />;
    case "code":
      return <CodePanel />;
    case "serial":
      return <SerialPanel />;
    case "problems":
      return <ProblemsPanel />;
    case "ai":
      return <WorkspaceCirra />;
  }
}
