import { notFound } from "next/navigation";
import { DemoDashboard } from "@/features/dashboard/ui/demo-dashboard";
export default function DemoProjectsPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <DemoDashboard all />;
}
