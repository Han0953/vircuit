"use client";
import { RetryButton } from "@/features/dashboard/ui/retry-button";
export default function DashboardError({ retry }: { retry: () => void }) {
  return <section role="alert" className="mx-auto max-w-lg space-y-4 p-6"><h1 className="text-xl font-semibold">Dashboard belum dapat dimuat</h1><p>Periksa koneksi lalu coba lagi. Draft lokal tetap tersedia.</p><RetryButton retry={retry} /></section>;
}
