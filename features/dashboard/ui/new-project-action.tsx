"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NewProjectAction() {
  const router = useRouter();
  const intent = useRef<string | null>(null);
  const [pending, setPending] = useState(false);
  return <Button disabled={pending} onClick={() => {
    if (intent.current) return;
    intent.current = crypto.randomUUID(); setPending(true);
    router.push(`/simulator?new=${intent.current}`);
  }}><Plus aria-hidden />{pending ? "Menyiapkan…" : "Proyek baru"}</Button>;
}
