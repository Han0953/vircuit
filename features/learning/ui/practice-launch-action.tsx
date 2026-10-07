"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
export function PracticeLaunchAction({ lessonId }: { lessonId: string }) {
  const router = useRouter();
  const intent = useRef<string | null>(null);
  const [pending, setPending] = useState(false);
  return <Button disabled={pending} onClick={() => {
    if (intent.current) return;
    intent.current = crypto.randomUUID(); setPending(true);
    router.push(`/simulator?${new URLSearchParams({ lesson: lessonId, practice: intent.current })}`);
  }}><FlaskConical aria-hidden />{pending ? "Menyiapkan praktik…" : "Praktikkan di Lab"}</Button>;
}
