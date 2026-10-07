"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
export function PracticeLaunchAction({ lessonId, challenge = false }: { lessonId: string; challenge?: boolean }) {
  const router = useRouter();
  const intent = useRef<string | null>(null);
  const [pending, setPending] = useState(false);
  return <Button disabled={pending} onClick={() => {
    if (intent.current) return;
    intent.current = crypto.randomUUID(); setPending(true);
    router.push(`/simulator?${new URLSearchParams({ lesson: lessonId, practice: intent.current, ...(challenge ? { challenge: "1" } : {}) })}`);
  }}><FlaskConical aria-hidden />{pending ? "Menyiapkan praktik…" : challenge ? "Mulai Tantangan" : "Praktikkan di Lab"}</Button>;
}
