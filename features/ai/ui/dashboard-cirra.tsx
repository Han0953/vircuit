"use client";

import { useRef } from "react";
import { Sparkles } from "lucide-react";
import { DashboardMotionSection } from "@/features/dashboard/motion/dashboard-motion";
import { CirraChat } from "./cirra-chat";
import { useChatViewport } from "./use-chat-viewport";

// Dashboard conversations have no implicit access to a workspace draft.
const generalContext = () => ({});

export function DashboardCirra({ owner }: { owner: string }) {
  const root = useRef<HTMLDivElement>(null);
  useChatViewport(root, true, true);
  return <div ref={root} className="dashboard-cirra">
    <DashboardMotionSection className="flex h-full min-h-0 flex-col gap-4">
      <header data-motion="header" className="shrink-0">
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight"><Sparkles aria-hidden className="size-6 text-ai" />Tanya Cirra</h1>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">Bahas konsep, kode, atau ide proyek IoT. Untuk memeriksa rangkaian aktif, gunakan Cirra di Virtual Lab.</p>
      </header>
      <div data-motion="card" className="min-h-0 flex-1 overflow-hidden rounded-2xl border bg-surface shadow-sm">
        <CirraChat owner={owner} scope="dashboard" contextLabel="Percakapan umum tentang elektronika dan IoT" getContext={generalContext} />
      </div>
    </DashboardMotionSection>
  </div>;
}
