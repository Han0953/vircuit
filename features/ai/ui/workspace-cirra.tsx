"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { usePersistence } from "@/features/projects/store";
import { flushDraft } from "@/features/projects/local/controller";
import { Button } from "@/components/ui/button";
import { CirraChat } from "./cirra-chat";
import { workspaceContext } from "./workspace-context";
import { clearCirraAccount, ensureSession, sessionKey, updateSession, useCirraSession } from "./session-store";
export function WorkspaceCirra({ active = true }: { active?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const owner = usePersistence((s) => s.userId);
  const draftId = usePersistence((s) => s.draft?.id);
  const lessonId = usePersistence((s) => s.draft?.learningContext?.lessonId);
  const launch = useCirraSession((s) => s.launch);
  const previous = useRef(owner);
  useEffect(() => { if (previous.current && previous.current !== owner) clearCirraAccount(previous.current); previous.current = owner; }, [owner]);
  useEffect(() => {
    if (!owner || !launch) return;
    const key = sessionKey(owner, draftId ?? "workspace");
    if (launch.scope && launch.scope !== key) return;
    ensureSession(owner, draftId ?? "workspace");
    if (useCirraSession.getState().sessions[key]?.launchNonce === launch.nonce) return;
    updateSession(key, { mode: launch.mode, hintLevel: 1, launchNonce: launch.nonce });
    useCirraSession.setState({ launch: { ...launch, scope: key } });
  }, [owner, draftId, launch]);
  if (!owner) return <section aria-label="Cirra memerlukan akun" className="space-y-3 p-4 text-sm"><h2 className="font-semibold">Masuk untuk bertanya ke Cirra</h2><p>Tutor, Debugger, dan Project Assistant tersedia setelah login. Virtual Lab tetap bisa kamu gunakan sebagai tamu.</p><Button asChild><Link href={`/masuk?next=${encodeURIComponent(pathname)}`} onClick={(event) => { event.preventDefault(); void flushDraft().then(() => router.push(`/masuk?next=${encodeURIComponent(pathname)}`)).catch(() => usePersistence.setState({ error: "Draft belum tersimpan. Coba lagi sebelum masuk." })); }}>Masuk</Link></Button></section>;
  return <CirraChat key={`${owner}:${draftId}`} owner={owner} scope={draftId ?? "workspace"} active={active} contextLabel={lessonId ? "Praktik lesson" : "Project aktif"} getContext={() => {
    const context = workspaceContext();
    if (useCirraSession.getState().launch?.scope !== sessionKey(owner, draftId ?? "workspace")) { delete context.selectedProblemId; context.bindings = {}; }
    return context;
  }} />;
}
