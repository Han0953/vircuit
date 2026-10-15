"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RetryButton({ retry, className }: { retry?: () => void; className?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return <Button variant="outline" size="sm" className={className} disabled={pending} aria-busy={pending} onClick={() => start(() => retry ? retry() : router.refresh())}>
    {pending ? <LoaderCircle aria-hidden className="size-3.5 animate-spin" /> : <RefreshCcw aria-hidden className="size-3.5" />}
    {pending ? "Memuat ulang…" : "Coba lagi"}
  </Button>;
}
