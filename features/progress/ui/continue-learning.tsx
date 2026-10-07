import Link from "next/link";
import { Button } from "@/components/ui/button";
import { deriveProgress } from "../derive";
import type { ProgressRow } from "../contracts";
export function ContinueLearning({ rows }: { rows: ProgressRow[] | null }) {
  if (!rows) return null;
  const next = deriveProgress(rows).continueLearning;
  return <section aria-label="Lanjutkan belajar" className="space-y-4 rounded-lg border bg-surface p-5"><p className="text-sm text-text-secondary">{next.review ? "Tinjau kembali materi" : "Lanjutkan belajar"}</p><h2 className="text-lg font-semibold">{next.lesson.title}</h2><p className="text-sm leading-relaxed text-text-secondary">{next.lesson.summary}</p><Button asChild><Link href={next.href}>{next.review ? "Tinjau materi" : "Buka materi"}</Link></Button></section>;
}
