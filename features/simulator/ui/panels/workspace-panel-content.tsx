import { ProblemsPanel, SerialPanel } from "./debug-panels";
import { ListChecks, Terminal } from "lucide-react";
export const workspaceTabs = [
  { id: "serial", label: "Serial Monitor", mobileLabel: "Monitor", icon: Terminal },
  { id: "problems", label: "Problems", mobileLabel: "Problems", icon: ListChecks },
] as const;
export type WorkspaceTab = (typeof workspaceTabs)[number]["id"];
export function isWorkspaceTab(value: string): value is WorkspaceTab { return workspaceTabs.some((tab) => tab.id === value); }
export { PropertiesPanel } from "./properties-panel";
export function WorkspacePanelContent({ tab }: { tab: WorkspaceTab }) { return tab === "serial" ? <SerialPanel /> : <ProblemsPanel />; }
