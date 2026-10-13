import { Skeleton } from "@/components/ui/skeleton";
export default function SettingsLoading() {
  return <div role="status" aria-label="Memuat pengaturan" className="space-y-6"><Skeleton className="h-10 w-48" /><Skeleton className="h-6 max-w-xl" /><div className="grid gap-6 xl:grid-cols-[14rem_1fr]"><Skeleton className="h-40 xl:h-80" /><Skeleton className="h-96" /></div></div>;
}
