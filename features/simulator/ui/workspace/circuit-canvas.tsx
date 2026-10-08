"use client";
import { useMemo, useRef, useState } from "react";
import { ReactFlow, ReactFlowProvider, Background, BackgroundVariant, Controls, ConnectionMode, useReactFlow, type NodeChange } from "@xyflow/react";
import { useTheme } from "next-themes";
import { useProject } from "../../stores/project-store";
import { useCanvas } from "../../stores/canvas-store";
import { validConnection } from "../../validation/wires";
import { catalog } from "../../catalog/registry";
import { ComponentNode, type CircuitNode } from "../components/component-node";
import { CircuitWire } from "../components/circuit-wire";
import { PlacementPreview } from "../components/placement-preview";
import { findBreadboardPlacement, type Placement } from "../../geometry/breadboard-placement";
import type { ComponentInstance } from "../../types/project";
import "@xyflow/react/dist/style.css";
const nodeTypes = { component: ComponentNode };
const edgeTypes = { wire: CircuitWire };
function CanvasContent() {
  const [preview, setPreview] = useState<{ component: ComponentInstance; placement: Placement } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const reconnecting = useRef<string | null>(null);
  const canvasElement = useRef<HTMLDivElement>(null);
  const components = useProject((s) => s.project.components);
  const selection = useCanvas((s) => s.selection);
  const wires = useProject((s) => s.project.wires);
  const edges = useMemo(() => wires.map((w) => ({ id: w.id, type: "wire", zIndex: 2, source: w.from.componentId, sourceHandle: w.from.pinId, target: w.to.componentId, targetHandle: w.to.pinId, selected: selection.includes(w.id), style: { stroke: w.color === "red" ? "var(--destructive)" : w.color === "green" ? "var(--success)" : w.color === "neutral" ? "var(--foreground)" : "var(--primary)", strokeWidth: 2 } })), [wires, selection]);
  const viewport = useProject((s) => s.project.viewport);
  const edit = useProject((s) => s.edit);
  const { screenToFlowPosition } = useReactFlow();
  const { resolvedTheme } = useTheme();
  const nodes = useMemo<CircuitNode[]>(() => components.map((component) => ({ id: component.id, type: "component", zIndex: component.type.startsWith("breadboard-") ? 0 : 1, position: component.position, selected: selection.includes(component.id), data: { component } })), [components, selection]);
  function changeNodes(changes: NodeChange<CircuitNode>[]) {
    for (const change of changes) {
      if (change.type === "position" && change.position) edit((p) => ({ ...p, components: p.components.map((c) => c.id === change.id ? { ...c, position: change.position! } : c) }), false);
      if (change.type === "select") useCanvas.setState((s) => ({ selection: change.selected ? [...new Set([...s.selection, change.id])] : s.selection.filter((id) => id !== change.id) }));
      if (change.type === "remove") useProject.getState().remove([change.id]);
    }
  }
  return <div ref={canvasElement} tabIndex={0} className="h-full min-h-0 focus-visible:outline-2 focus-visible:outline-ring focus-visible:-outline-offset-2" data-testid="circuit-canvas" onKeyDown={(e) => {
    if ((e.target as HTMLElement).closest("input,textarea,[contenteditable=true]")) return;
    if (e.ctrlKey || e.metaKey) {
      if (e.key.toLowerCase() === "z") { e.preventDefault(); if (e.shiftKey) useProject.getState().redo(); else useProject.getState().undo(); }
      if (e.key.toLowerCase() === "d") { e.preventDefault(); useProject.getState().duplicate(selection); }
    }
  }}><ReactFlow<CircuitNode> nodes={nodes} edges={edges} edgeTypes={edgeTypes} connectionMode={ConnectionMode.Loose} connectOnClick connectionRadius={30}
    elevateNodesOnSelect={false}
    isValidConnection={(c) => { const p = useProject.getState().project; return validConnection({ ...p, wires: p.wires.filter((w) => w.id !== reconnecting.current) }, { componentId: c.source, pinId: c.sourceHandle ?? "" }, { componentId: c.target, pinId: c.targetHandle ?? "" }); }}
    onReconnectStart={(_, edge) => { reconnecting.current = edge.id; }} onReconnectEnd={() => { reconnecting.current = null; }}
    onReconnect={(edge, c) => edit((p) => {
      const from = { componentId: c.source, pinId: c.sourceHandle ?? "" }, to = { componentId: c.target, pinId: c.targetHandle ?? "" };
      if (!validConnection({ ...p, wires: p.wires.filter((w) => w.id !== edge.id) }, from, to)) return p;
      return { ...p, wires: p.wires.map((w) => w.id === edge.id ? { ...w, from, to } : w) };
    })}
    onConnect={(c) => edit((p) => ({ ...p, wires: [...p.wires, { id: crypto.randomUUID(), from: { componentId: c.source, pinId: c.sourceHandle! }, to: { componentId: c.target, pinId: c.targetHandle! }, color: "blue" }] }))}
    onEdgesChange={(changes) => { for (const c of changes) { if (c.type === "remove") useProject.getState().remove([c.id]); if (c.type === "select") useCanvas.setState((s) => ({ selection: c.selected ? [...new Set([...s.selection, c.id])] : s.selection.filter((id) => id !== c.id) })); } }}
    onEdgeClick={(_, edge) => useCanvas.getState().select([edge.id])}
    onEdgesDelete={(edges) => { useProject.getState().remove(edges.map((e) => e.id)); canvasElement.current?.focus(); }}
    onNodesDelete={(nodes) => { useProject.getState().remove(nodes.map((n) => n.id)); canvasElement.current?.focus(); }} nodeTypes={nodeTypes} onNodesChange={changeNodes}
    onNodeDragStart={() => { useProject.getState().checkpoint(); setNotice(null); }}
    onNodeDrag={(_, node, dragged) => {
      const component = { ...node.data.component, position: node.position };
      const placement = dragged.length === 1 ? findBreadboardPlacement(component, useProject.getState().project.components) : null;
      setPreview(placement ? { component, placement } : null);
    }}
    onNodeDragStop={(_, node, dragged) => {
      const placement = dragged.length === 1 ? findBreadboardPlacement({ ...node.data.component, position: node.position }, useProject.getState().project.components) : null;
      if (placement?.valid) {
        edit((p) => ({ ...p, components: p.components.map((c) => c.id === node.id ? { ...c, position: placement.position } : c) }), false);
        setNotice("Kaki selaras dengan lubang. Hubungkan pin ke breadboard dengan kabel agar tersambung secara listrik.");
      } else setNotice(placement?.reason ?? null);
      setPreview(null);
    }} onPaneClick={() => setNotice(null)} viewport={viewport} onViewportChange={(viewport) => edit((p) => ({ ...p, viewport }), false)} minZoom={0.25} maxZoom={4} panOnDrag zoomOnPinch selectionKeyCode="Shift" panActivationKeyCode="Space" deleteKeyCode={["Backspace", "Delete"]} colorMode={resolvedTheme === "dark" ? "dark" : "light"}
    onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; }} onDrop={(e) => { e.preventDefault(); const type = e.dataTransfer.getData("application/vircuit-component"); if (catalog.some((c) => c.key === type)) useProject.getState().add(type, screenToFlowPosition({ x: e.clientX, y: e.clientY })); }}>
    <Background variant={BackgroundVariant.Dots} gap={20} color="var(--border-strong)" />
    <Controls />
    {preview && <PlacementPreview {...preview} />}
    {(preview || notice) && <div role="status" className="pointer-events-none absolute inset-x-4 top-4 mx-auto max-w-md rounded border bg-surface px-3 py-2 text-xs text-text-secondary">{preview ? preview.placement.valid ? "Posisi cocok. Lepas untuk menyelaraskan; koneksi tetap memakai kabel." : preview.placement.reason : notice}</div>}
    {!nodes.length && <div className="pointer-events-none absolute inset-x-4 top-4 text-center text-xs text-text-secondary">Tambahkan komponen dari Parts untuk mulai merangkai.</div>}
  </ReactFlow></div>;
}
export function CircuitCanvas() { return <ReactFlowProvider><CanvasContent /></ReactFlowProvider>; }
