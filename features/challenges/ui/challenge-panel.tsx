"use client";
import { useEffect, useState, useRef, useId } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { useProject } from "@/features/simulator/stores/project-store";
import { usePersistence } from "@/features/projects/store";
import { patchDraft, flushDraft } from "@/features/projects/local/controller";
import { lessonChallenge } from "../registry";
import { roleCandidates, resolveBindings } from "../bindings";
import { previewSubmission } from "../preview";
import type { Bindings, Evaluation, Submission, Role } from "../contracts";
import { pendingSubmissions, queueSubmission, type PendingSubmission } from "../pending";
import { syncSubmission } from "../sync";
const roleLabels: Record<Role, string> = { board: "Board", led: "LED", button: "Tombol", potentiometer: "Potentiometer", red_led: "LED merah", yellow_led: "LED kuning", green_led: "LED hijau" };

export function ChallengePanel({ lessonId }: { lessonId: string }) {
  const id = useId();
  const challenge = lessonChallenge(lessonId);
  const challengeId = challenge?.id;
  const project = useProject((s) => s.project);
  const context = usePersistence((s) => s.draft?.learningContext);
  const owner = usePersistence((s) => s.userId);
  const workspaceBusy = usePersistence((s) => s.busy || s.handoffBusy);
  const [bindings, setBindings] = useState<Bindings>({});
  const [result, setResult] = useState<Evaluation | null>(null);
  const [captured, setCaptured] = useState<Submission | null>(null);
  const [pending, setPending] = useState<PendingSubmission | null>(null);
  const [verified, setVerified] = useState(false);
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    if (!owner || !challengeId) return;
    let active = true;
    void pendingSubmissions(owner).then((items) => {
      const item = items.filter((i) => i.submission.challengeId === challengeId).at(-1);
      if (active && item) { setPending(item); setResult(item.preview); setCaptured(item.submission); setBindings(item.submission.bindings); }
    }).catch(() => { if (active) setError("Hasil tertunda belum dapat dipulihkan."); });
    return () => { active = false; };
  }, [owner, challengeId]);
  if (!challenge || !context) return null;
  const resolved = resolveBindings(project, challenge, bindings);
  async function evaluate() {
    if (!challenge || !context || !owner || busy || usePersistence.getState().busy) return;
    setBusy(true); setError(""); usePersistence.setState({ busy: true });
    setVerified(false);
    try {
      patchDraft({ learningContext: { ...context, challengeId: challenge.id, challengeVersion: challenge.version, phase: "evaluation" } });
      await flushDraft();
      const input: Submission = { challengeId: challenge.id, version: challenge.version, operationId: crypto.randomUUID(), project: structuredClone(useProject.getState().project), bindings, projectId: usePersistence.getState().draft?.cloud?.id ?? null };
      const preview = await previewSubmission(input);
      if (!mounted.current || usePersistence.getState().userId !== owner) return;
      setCaptured(input); setResult(preview);
      const item = await queueSubmission(owner, input, preview);
      if (!mounted.current || usePersistence.getState().userId !== owner) return;
      setPending(item); setCaptured(item.submission); setResult(item.preview);
      const acknowledgment = await syncSubmission(item);
      if (mounted.current && usePersistence.getState().userId === owner) { setResult(acknowledgment.result); setVerified(true); setPending(null); }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Evaluasi gagal."); }
    finally { setBusy(false); usePersistence.setState({ busy: false }); }
  }
  async function retry() {
    if (!pending || busy || !owner || usePersistence.getState().busy) return;
    setBusy(true); setError(""); usePersistence.setState({ busy: true });
    try {
      const acknowledgment = await syncSubmission(pending);
      if (mounted.current && usePersistence.getState().userId === owner) { setResult(acknowledgment.result); setVerified(true); setPending(null); }
    } catch (cause) { if (mounted.current) setError(cause instanceof Error ? cause.message : "Sinkronisasi gagal."); }
    finally { if (mounted.current) setBusy(false); usePersistence.setState({ busy: false }); }
  }
  function choose(role: Role, value: string) {
    setBindings((old) => { const next = { ...old }; if (value) next[role] = value; else delete next[role]; return next; });
  }
  return <Sheet><SheetTrigger asChild><Button variant="outline">Tantangan & evaluasi</Button></SheetTrigger><SheetContent side="right" className="w-full overflow-y-auto p-5 sm:max-w-lg"><SheetHeader className="px-0"><SheetTitle>{challenge.title}</SheetTitle><SheetDescription>{challenge.objective}</SheetDescription></SheetHeader>
    <p className="my-4 text-xs text-text-secondary">Tahap aktif: {result ? "Evaluasi" : "Tantangan"}. Penilaian memakai snapshot terpisah dari simulasi aktif.</p>
    <fieldset className="space-y-3" disabled={busy}><legend className="mb-3 font-semibold">Komponen yang dinilai</legend>{challenge.roles.map((role) => <div key={role} className="text-sm">
      <label htmlFor={`${id}-${role}`} className="block">{roleLabels[role]}</label>
      <select id={`${id}-${role}`} className="mt-1 block min-h-11 w-full rounded-md border bg-background px-3 focus-visible:ring-2 focus-visible:ring-ring" value={resolved[role] ?? ""} onChange={(event) => choose(role, event.target.value)}>
        <option value="">Pilih komponen</option>{roleCandidates(project, role).map((c) => <option key={c.id} value={c.id}>{c.label} ({c.id})</option>)}
      </select>
    </div>)}</fieldset>
    <Button className="my-5 w-full" disabled={busy || workspaceBusy} onClick={() => void evaluate()}>{busy ? "Mengevaluasi…" : "Evaluasi"}</Button>
    {error && <p role="alert" className="my-3 text-sm">{error}</p>}
    {pending && <Button disabled={busy || workspaceBusy} variant="outline" className="mb-4 w-full" onClick={() => void retry()}>Coba sinkronkan hasil</Button>}
    <div aria-live="polite">{result && <><h3 className="font-semibold">{result.passed ? "Terpenuhi" : "Belum terpenuhi"}</h3><p className="my-2 text-sm">{verified ? result.passed ? "Terverifikasi — materi selesai" : "Hasil terverifikasi dan tersimpan. Coba perbaiki lagi." : "Hasil lokal — belum tersinkronisasi"}</p>{captured && (JSON.stringify(captured.project) !== JSON.stringify(project) || JSON.stringify(captured.bindings) !== JSON.stringify(bindings)) && <p className="text-sm">Project atau pilihan komponen berubah. Evaluasi ulang untuk hasil terbaru.</p>}{result.diagnostics.map((text, i) => <p key={i} className="my-2 text-sm">{text}</p>)}</>}</div>
    <ul className="mt-4 space-y-4">{challenge.requirements.map((rule) => { const verdict = result?.requirements.find((r) => r.id === rule.id); return <li key={rule.id} className="rounded-md border p-3 text-sm"><p>{rule.message}</p>{verdict && <p className="mt-2 font-medium">{verdict.status === "satisfied" ? "Terpenuhi" : verdict.status === "blocked" ? "Belum dapat dinilai" : "Belum terpenuhi"}</p>}<details className="mt-2"><summary className="min-h-11 cursor-pointer py-3 focus-visible:ring-2 focus-visible:ring-ring">Petunjuk</summary><p className="text-text-secondary">{rule.hint}</p></details></li>; })}</ul>
  </SheetContent></Sheet>;
}
