"use client";
import { PracticeContextPanel } from "@/features/learning/ui/practice-context";
import { stopSimulation } from "../../worker/bridge";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Info, PanelLeft, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PartsPanel } from "../panels/parts-panel";
import { isWorkspaceTab, PropertiesPanel, WorkspacePanelContent, workspaceTabs, type WorkspaceTab } from "../panels/workspace-panel-content";
import { WorkspaceTopbar } from "../toolbar/workspace-topbar";
import { cn } from "@/lib/utils";

import { CircuitCanvas } from "./circuit-canvas";
import { ResizableWorkspace } from "./resizable-workspace";
import { DraftRecovery } from "@/features/projects/ui/draft-recovery";
import { Autosave } from "@/features/projects/ui/autosave";
import { useCirraSession } from "@/features/ai/ui/session-store";

const subscribeDesktop = (listener: () => void) => { const query = window.matchMedia("(min-width: 1024px)"); query.addEventListener("change", listener); return () => query.removeEventListener("change", listener); };

type MobilePanel = "parts" | "properties" | WorkspaceTab;

export function WorkspaceShell() {
  return <DraftRecovery><WorkspaceContent /></DraftRecovery>;
}

function WorkspaceContent() {
  const desktop = useSyncExternalStore(subscribeDesktop, () => window.matchMedia("(min-width: 1024px)").matches, () => false);
  const [codeVisited, setCodeVisited] = useState(false);
  const [category, setCategory] = useState("Boards");
  const [tab, setTab] = useState<WorkspaceTab>("circuit");
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("parts");
  const [sheetOpen, setSheetOpen] = useState(false);
  const lastTrigger = useRef<HTMLButtonElement | null>(null);
  const canvas = useRef<HTMLElement | null>(null);

  useEffect(() => () => stopSimulation(), []);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeMobileSheet = () => { if (desktop.matches) setSheetOpen(false); };
    desktop.addEventListener("change", closeMobileSheet);
    return () => desktop.removeEventListener("change", closeMobileSheet);
  }, []);

  function openPanel(panel: MobilePanel, trigger: HTMLButtonElement) {
    if (isWorkspaceTab(panel)) { setTab(panel); if (panel === "code") setCodeVisited(true); }
    if (window.matchMedia("(min-width: 1024px)").matches) { if (panel === "ai") window.dispatchEvent(new Event("vircuit:show-bottom")); return; }
    lastTrigger.current = trigger;
    setMobilePanel(panel);
    setSheetOpen(true);
  }

  useEffect(() => {
    const open = () => {
      setTab("ai"); setMobilePanel("ai");
      if (window.matchMedia("(min-width: 1024px)").matches) window.dispatchEvent(new Event("vircuit:show-bottom"));
      else setSheetOpen(true);
    };
    const account = new BroadcastChannel("vircuit-auth");
    account.onmessage = () => useCirraSession.setState({ threads: {}, launch: null });
    window.addEventListener("vircuit:open-cirra", open);
    return () => { window.removeEventListener("vircuit:open-cirra", open); account.close(); };
  }, []);

  const panelTitle = mobilePanel === "parts" ? "Parts" : mobilePanel === "properties" ? "Properties" : workspaceTabs.find((item) => item.id === mobilePanel)?.label;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
      <Autosave />
      <a href="#workspace-canvas" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:rounded-md focus:bg-surface focus:p-4 focus:ring-2 focus:ring-ring">Lewati ke canvas</a>
      <WorkspaceTopbar onOpenAI={(trigger) => openPanel("ai", trigger)} />
      <PracticeContextPanel />
      <p id="workspace-unavailable" className="flex shrink-0 items-start gap-2 border-b bg-surface-muted px-4 py-2 text-xs leading-relaxed text-text-secondary">
        <Info aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
        Simulasi edukatif · Arduino C/C++ subset. Draft disimpan lokal di browser ini. Ekspor JSON untuk cadangan.
      </p>
      <main aria-label="Workspace Virtual Lab" className="flex min-h-0 flex-1 flex-col">
        <ResizableWorkspace
          parts={<><h2 className="border-b px-4 py-3 text-sm font-semibold">Parts</h2><PartsPanel category={category} onCategoryChange={setCategory} /></>}
          properties={<><h2 className="border-b px-4 py-3 text-sm font-semibold">Properties</h2><PropertiesPanel /></>}
          bottom={<Tabs value={tab} onValueChange={(value) => { if (isWorkspaceTab(value)) { setTab(value); if (value === "ai") window.dispatchEvent(new Event("vircuit:show-bottom")); if (value === "code") setCodeVisited(true); } }} className="h-full gap-0 overflow-hidden">
            <TabsList aria-label="Panel workspace" variant="line" className="w-full shrink-0 justify-start border-b bg-surface px-4">
              {workspaceTabs.map(({ id, label, icon: Icon }) => <TabsTrigger key={id} value={id} className="flex-none px-4"><Icon aria-hidden="true" />{label}</TabsTrigger>)}
            </TabsList>
            {workspaceTabs.map(({ id }) => <TabsContent forceMount key={id} value={id} className="min-h-0 overflow-auto data-[state=inactive]:hidden">{(id !== "code" || (desktop && codeVisited)) && (id !== "ai" || desktop) && <WorkspacePanelContent tab={id} />}</TabsContent>)}
          </Tabs>}>
          <section ref={canvas} id="workspace-canvas" tabIndex={-1} aria-label="Circuit Canvas" className="flex h-full min-w-0 flex-col focus-visible:outline-2 focus-visible:outline-ring">
            <div className="flex justify-end border-b lg:hidden"><Button variant="ghost" onClick={(event) => openPanel("properties", event.currentTarget)}><SlidersHorizontal />Properties</Button></div>
            <div className="min-h-0 flex-1"><CircuitCanvas /></div>
          </section>
        </ResizableWorkspace>
        <nav aria-label="Panel workspace" className="grid shrink-0 grid-cols-5 border-t bg-surface px-1 pb-[env(safe-area-inset-bottom)] lg:hidden">
          <Button variant="ghost" className="h-auto min-h-16 flex-col gap-1 px-1 text-xs" onClick={(event) => openPanel("parts", event.currentTarget)}><PanelLeft aria-hidden="true" />Parts</Button>
          {workspaceTabs.filter(({ id }) => id !== "circuit").map(({ id, label, mobileLabel, icon: Icon }) => (
            <Button key={id} variant="ghost" aria-label={`Buka ${label}`} className="h-auto min-h-16 flex-col gap-1 px-1 text-xs" onClick={(event) => openPanel(id, event.currentTarget)}><Icon aria-hidden="true" />{mobileLabel}</Button>
          ))}
        </nav>
      </main>
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className={cn("max-h-dvh gap-0 rounded-t-xl pb-[env(safe-area-inset-bottom)]", mobilePanel === "code" || mobilePanel === "ai" ? "h-dvh rounded-none" : "h-[85dvh]")}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            const trigger = lastTrigger.current;
            if (trigger?.getClientRects().length) trigger.focus();
            else canvas.current?.focus();
          }}>
          <SheetHeader className="shrink-0 border-b pr-16">
            <SheetTitle>{panelTitle}</SheetTitle>
            <SheetDescription>Tutup panel untuk kembali ke canvas.</SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-hidden">
            {mobilePanel === "parts" ? <PartsPanel category={category} onCategoryChange={setCategory} /> : mobilePanel === "properties" ? <PropertiesPanel /> : <WorkspacePanelContent tab={mobilePanel} />}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
