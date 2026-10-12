"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { readDraft } from "../local/drafts";

export function GuestDraftNotice() {
  const [title, setTitle] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    void readDraft("guest").then((draft) => {
      if (active && draft && (draft.localRevision > 0 || draft.saveIntent || draft.project.components.length > 0)) setTitle(draft.project.metadata.name);
    }).catch(() => {});
    return () => { active = false; };
  }, []);
  if (!title) return null;
  return <aside aria-label="Draft tamu tersedia" className="flex flex-col gap-3 rounded-xl border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
    <p className="text-sm">Draft tamu “{title}” tersedia di browser ini. Buka di lab untuk menyimpannya ke akun.</p>
    <Button asChild variant="outline" className="shrink-0"><Link href="/simulator">Buka draft tamu</Link></Button>
  </aside>;
}
