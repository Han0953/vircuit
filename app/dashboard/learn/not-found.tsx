import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function LearningNotFound() {
  return <div className="space-y-4"><h1 className="text-2xl font-semibold">Materi tidak ditemukan</h1><p className="text-text-secondary">Course atau lesson ini belum tersedia.</p><Button asChild variant="outline"><Link href="/dashboard/learn">Kembali ke Belajar</Link></Button></div>;
}
