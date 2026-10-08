"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { usePersistence } from "@/features/projects/store";
import { flushDraft } from "@/features/projects/local/controller";
import { Button } from "@/components/ui/button";
import { CirraChat } from "./cirra-chat";
import { workspaceContext } from "./workspace-context";
import { clearCirraAccount, useCirraSession } from "./session-store";
export function WorkspaceCirra() {
  const router = useRouter();
  const pathname = usePathname();
  const owner = usePersistence((s) => s.userId);
  const draftId = usePersistence((s) => s.draft?.id);
  const lessonId = usePersistence((s) => s.draft?.learningContext?.lessonId);
  const launch = useCirraSession((s) => s.launch);
  const previous = useRef(owner);
  useEffect(() => { if (previous.current && previous.current !== owner) clearCirraAccount(previous.current); previous.current = owner; }, [owner]);
  if (!owner) return <section aria-label="Cirra memerlukan akun" className="space-y-3 p-4 text-sm"><h2 className="font-semibold">Masuk untuk bertanya ke Cirra</h2><p>Tutor, Debugger, dan Project Assistant tersedia setelah login. Virtual Lab tetap bisa kamu gunakan sebagai tamu.</p><Button asChild><Link href={`/masuk?next=${encodeURIComponent(pathname)}`} onClick={(event) => { event.preventDefault(); void flushDraft().then(() => router.push(`/masuk?next=${encodeURIComponent(pathname)}`)).catch(() => usePersistence.setState({ error: "Draft belum tersimpan. Coba lagi sebelum masuk." })); }}>Masuk</Link></Button></section>;
  return <CirraChat key={`${owner}:${draftId}:${launch?.nonce ?? 0}`} owner={owner} scope={draftId ?? "workspace"} initialMode={launch?.mode ?? "tutor"} contextLabel={lessonId ?? "project aktif"} getContext={workspaceContext} />;
}
