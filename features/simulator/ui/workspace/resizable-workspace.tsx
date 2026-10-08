"use client";

import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { Group, Panel, Separator, useGroupRef } from "react-resizable-panels";
import { Maximize, Minimize, PanelBottom, PanelLeft, PanelRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { defaultLayout, layoutStorageKey, parseLayout, type PanelName } from "./layout-preferences";

type WorkspaceProps = {
  parts: ReactNode;
  properties: ReactNode;
  bottom: ReactNode;
  children: ReactNode;
  navigation?: ReactNode;
  overlay?: ReactNode;
  sidebars?: boolean;
};

const controls = [
  { name: "left", label: "Parts", icon: PanelLeft },
  { name: "right", label: "Properties", icon: PanelRight },
  { name: "bottom", label: "Panel bawah", icon: PanelBottom },
] as const;

function subscribeViewport(callback: () => void) {
  const query = window.matchMedia("(min-width: 1024px)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

export function ResizableWorkspace({ parts, properties, bottom, children, navigation, overlay, sidebars = true }: WorkspaceProps) {
  const desktop = useSyncExternalStore(subscribeViewport, () => window.matchMedia("(min-width: 1024px)").matches, () => false);
  const [preferences, setPreferences] = useState(defaultLayout);
  const [focus, setFocus] = useState(false);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const horizontal = useGroupRef();
  const vertical = useGroupRef();

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try { setPreferences(parseLayout(localStorage.getItem(layoutStorageKey))); }
      catch { setStorageError(true); }
      setReady(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(layoutStorageKey, JSON.stringify(preferences)); }
    catch { queueMicrotask(() => setStorageError(true)); }
  }, [preferences, ready]);

  const left = desktop && sidebars && !focus && preferences.left.visible;
  const right = desktop && sidebars && !focus && preferences.right.visible;
  const lower = desktop && !focus && preferences.bottom.visible;

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      horizontal.current?.setLayout({
        left: left ? preferences.left.size : 0,
        center: 100 - (left ? preferences.left.size : 0) - (right ? preferences.right.size : 0),
        right: right ? preferences.right.size : 0,
      });
      vertical.current?.setLayout({ upper: lower ? 100 - preferences.bottom.size : 100, bottom: lower ? preferences.bottom.size : 0 });
    });
    return () => cancelAnimationFrame(frame);
  }, [left, right, lower, preferences, horizontal, vertical]);

  function toggle(name: PanelName) {
    setPreferences((current) => ({ ...current, [name]: { ...current[name], visible: !current[name].visible } }));
  }

  return <div className="flex min-h-0 flex-1 flex-col">
    <Group groupRef={horizontal} className="min-h-0 flex-1" onLayoutChanged={(layout, meta) => {
      if (meta.isUserInteraction && desktop && !focus) setPreferences((p) => ({
        ...p,
        left: { ...p.left, size: left ? layout.left : p.left.size },
        right: { ...p.right, size: right ? layout.right : p.right.size },
      }));
    }}>
      <Panel style={{ overflow: "hidden" }} id="left" minSize={left ? "15%" : "0%"} maxSize={left ? "32%" : "0%"} className="h-full bg-surface">
        <aside aria-label="Parts" className="h-full overflow-y-auto" inert={!left}>{parts}</aside>
      </Panel>
      <Separator disabled={!left} aria-label="Ubah lebar Parts" className={left ? "workspace-divider w-1 cursor-col-resize" : "hidden"} />
      <Panel style={{ overflow: "hidden" }} id="center" minSize="36%" className="h-full min-w-0">
        <div className="flex h-full min-h-0 flex-col">
          <TooltipProvider>
            <div className="flex shrink-0 items-center justify-between border-b px-3">
              {navigation ?? <span className="text-sm font-medium">Circuit</span>}
              <div className="flex gap-1">
                {controls.map(({ name, label, icon: Icon }) => <Tooltip key={name}>
                  <TooltipTrigger asChild>
                    <Button size="icon" variant="ghost" className="hidden lg:inline-flex" disabled={focus || (!sidebars && name !== "bottom")} aria-label={`Toggle ${label}`} aria-pressed={preferences[name].visible && !focus && (sidebars || name === "bottom")} onClick={() => toggle(name)}><Icon /></Button>
                  </TooltipTrigger>
                  <TooltipContent>{label}</TooltipContent>
                </Tooltip>)}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="icon" variant="ghost" className="hidden lg:inline-flex" aria-label="Focus Mode" aria-pressed={focus} onClick={() => setFocus(!focus)}>{focus ? <Minimize /> : <Maximize />}</Button>
                  </TooltipTrigger>
                  <TooltipContent>{focus ? "Pulihkan panel" : "Perluas workspace"}</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </TooltipProvider>
          {storageError && <p role="status" className="px-3 text-xs text-text-secondary">Preferensi layout tidak dapat disimpan di browser ini.</p>}
          <div className="relative min-h-0 flex-1">
            <Group orientation="vertical" groupRef={vertical} className="h-full min-h-0" onLayoutChanged={(layout, meta) => {
              if (meta.isUserInteraction && lower) setPreferences((p) => ({ ...p, bottom: { visible: true, size: layout.bottom } }));
            }}>
              <Panel style={{ overflow: "hidden" }} id="upper" minSize="35%">{children}</Panel>
              <Separator disabled={!lower} aria-label="Ubah tinggi panel bawah" className={lower ? "workspace-divider h-1 cursor-row-resize" : "hidden"} />
              <Panel style={{ overflow: "hidden" }} id="bottom" minSize={lower ? "15%" : "0%"} maxSize={lower ? "65%" : "0%"} className="h-full overflow-hidden bg-surface">
                <div className="h-full" inert={!lower}>{bottom}</div>
              </Panel>
            </Group>
            {overlay}
          </div>
        </div>
      </Panel>
      <Separator disabled={!right} aria-label="Ubah lebar Properties" className={right ? "workspace-divider w-1 cursor-col-resize" : "hidden"} />
      <Panel style={{ overflow: "hidden" }} id="right" minSize={right ? "15%" : "0%"} maxSize={right ? "32%" : "0%"} className="h-full bg-surface">
        <aside aria-label="Properties" className="h-full overflow-y-auto" inert={!right}>{properties}</aside>
      </Panel>
    </Group>
  </div>;
}
