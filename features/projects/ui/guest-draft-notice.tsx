"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileClock } from "lucide-react";
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
  return <Button asChild variant="ghost" className="gap-2"><Link href="/simulator" title={title} aria-label={`Lanjutkan draft lokal: ${title}`}><FileClock aria-hidden className="size-4" />Lanjutkan draft lokal</Link></Button>;
}
