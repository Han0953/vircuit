"use client";
import { Button } from "@/components/ui/button";
export default function DashboardError({ reset }: { reset: () => void }) {
  return <section role="alert" className="mx-auto max-w-lg space-y-4 p-6"><h1 className="text-xl font-semibold">Dashboard belum dapat dimuat</h1><p>Periksa koneksi lalu coba lagi. Draft lokal tetap tersedia.</p><Button onClick={reset}>Coba lagi</Button></section>;
}
