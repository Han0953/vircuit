"use client";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen } from "lucide-react";
import { usePersistence } from "@/features/projects/store";
import { flushDraft } from "@/features/projects/local/controller";
import { stopSimulation } from "@/features/simulator/worker/bridge";
import { Button } from "@/components/ui/button";
import { findLesson, lessonHref } from "../registry";
export function PracticeContextPanel() {
  const context = usePersistence((s) => s.draft?.learningContext);
  const busy = usePersistence((s) => s.busy || s.handoffBusy);
  const router = useRouter();
  if (!context) return null;
  const found = findLesson(context.lessonId);
  const practice = found?.lesson.practice;
  if (!found || !practice || practice.id !== context.practiceId || practice.version !== context.templateVersion) return <p className="border-b p-3 text-sm">Materi praktik ini sudah berubah. Project lokal tetap tersedia.</p>;
  return <section aria-label="Konteks praktik" className="shrink-0 border-b bg-surface px-3 py-2 text-sm">
    <div className="flex flex-wrap items-center justify-between gap-2"><p className="flex min-w-0 items-center gap-2"><BookOpen aria-hidden className="size-4 shrink-0 text-primary" /><span className="truncate" title={found.lesson.title}>{found.lesson.title}</span></p><Button variant="outline" disabled={busy} onClick={() => {
      void flushDraft().then(() => { stopSimulation(); router.push(lessonHref(found.course, found.lesson)); }).catch((cause: unknown) => usePersistence.setState({ error: cause instanceof Error ? cause.message : "Draft belum tersimpan." }));
    }}><ArrowLeft aria-hidden />Kembali ke lesson</Button></div>
    <details className="mt-1"><summary className="min-h-11 cursor-pointer py-3 text-text-secondary outline-none focus-visible:ring-2 focus-visible:ring-ring">Panduan praktik: {practice.goal}</summary><div className="max-h-44 space-y-2 overflow-y-auto pb-3 text-xs leading-relaxed"><p>Komponen: {practice.components.join(", ")}</p><ol className="space-y-2">{practice.instructions.map((instruction, index) => <li key={index}><strong>{instruction.phase}:</strong> {instruction.text}</li>)}</ol><p className="text-text-secondary">Latihan tanpa skor atau completion otomatis.</p></div></details>
  </section>;
}
