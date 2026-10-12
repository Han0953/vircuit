"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { ReactFlow, ReactFlowProvider, Background, BackgroundVariant, Controls, ConnectionMode, SelectionMode, useReactFlow, type NodeChange } from "@xyflow/react";
import { useTheme } from "next-themes";
import { useProject } from "../../stores/project-store";
import { useCanvas } from "../../stores/canvas-store";
import { validConnection } from "../../validation/wires";
import { catalog } from "../../catalog/registry";
import { ComponentNode, type CircuitNode } from "../components/component-node";
import { CircuitWire, type CircuitEdge } from "../components/circuit-wire";
import { TapWirePreview, WireConnectionPreview } from "../components/wire-connection-preview";
import { PlacementPreview } from "../components/placement-preview";
import { findBreadboardPlacement, type Placement } from "../../geometry/breadboard-placement";
import type { ComponentInstance } from "../../types/project";
import { useWireRouting } from "./use-wire-routing";
import { FlowElements } from "./flow-elements";
import { circuitIds, isEditingText, updateSelection, validSelection } from "../../stores/selection";
import { SelectionToolbar } from "../components/selection-toolbar";
import "@xyflow/react/dist/style.css";
const nodeTypes = { component: ComponentNode };
const edgeTypes = { wire: CircuitWire };
function CanvasContent() {
  const [preview, setPreview] = useState<{ component: ComponentInstance; placement: Placement } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [area, setArea] = useState(false);
  const reconnecting = useRef<string | null>(null);
  const canvasElement = useRef<HTMLDivElement>(null);
  const routing = useWireRouting();
  const [elements] = useState(() => new FlowElements());
  const components = useProject((s) => s.project.components);
  const selection = useCanvas((s) => s.selection);
  const wires = useProject((s) => s.project.wires);
  const edges = useMemo(() => elements.wireEdges(wires, selection, routing.routes), [elements, wires, selection, routing.routes]);
  const viewport = useProject((s) => s.project.viewport);
  const edit = useProject((s) => s.edit);
  const { screenToFlowPosition } = useReactFlow();
  const { resolvedTheme } = useTheme();
  const nodes = useMemo(() => elements.componentNodes(components, selection), [elements, components, selection]);
  useEffect(() => useProject.subscribe((state, previous) => {
    if (state.project.components !== previous.project.components || state.project.wires !== previous.project.wires) {
      useCanvas.getState().select(validSelection(state.project, useCanvas.getState().selection));
    }
  }), []);
  const focusCanvas = () => canvasElement.current?.focus({ preventScroll: true });
  function changeNodes(changes: NodeChange<CircuitNode>[]) {
    useCanvas.getState().select(updateSelection(useCanvas.getState().selection, changes.flatMap((c) => c.type === "select" ? [{ id: c.id, selected: c.selected }] : [])));
    for (const change of changes) {
      if (change.type === "position" && change.position) edit((p) => ({ ...p, components: p.components.map((c) => c.id === change.id ? { ...c, position: change.position! } : c) }), false);
      if (change.type === "remove") useProject.getState().remove([change.id]);
    }
  }
  return <div ref={canvasElement} tabIndex={0} className="flex h-full min-h-0 flex-col focus-visible:outline-2 focus-visible:outline-ring focus-visible:-outline-offset-2" data-testid="circuit-canvas" data-routing-pending={routing.pending} data-routing-revision={routing.revision} data-routing-batch-ms={routing.controller.stats.maxBatchMs.toFixed(2)} data-routing-compute-ms={routing.controller.stats.searchMs.toFixed(2)} onKeyDown={(e) => {
    if (isEditingText(e.target) || e.nativeEvent.isComposing) return;
    if (e.key === "Escape") useCanvas.getState().select([]);
    if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); useProject.getState().remove(selection); useCanvas.getState().select([]); focusCanvas(); }
    if (e.ctrlKey || e.metaKey) {
      if (e.key.toLowerCase() === "a") { e.preventDefault(); useCanvas.getState().select(circuitIds(useProject.getState().project)); }
      if (e.key.toLowerCase() === "z") { e.preventDefault(); if (e.shiftKey) useProject.getState().redo(); else useProject.getState().undo(); }
      if (e.key.toLowerCase() === "d") { e.preventDefault(); useProject.getState().duplicate(selection); }
    }
  }}>
    <SelectionToolbar area={area} onAreaChange={setArea} focusCanvas={focusCanvas} />
    <div className="min-h-0 flex-1"><ReactFlow<CircuitNode, CircuitEdge> nodes={nodes} edges={edges} edgeTypes={edgeTypes} connectionLineComponent={WireConnectionPreview} connectionMode={ConnectionMode.Loose} connectOnClick connectionRadius={30}
    elevateNodesOnSelect={false}
    isValidConnection={(c) => { const p = useProject.getState().project; return validConnection({ ...p, wires: p.wires.filter((w) => w.id !== reconnecting.current) }, { componentId: c.source, pinId: c.sourceHandle ?? "" }, { componentId: c.target, pinId: c.targetHandle ?? "" }); }}
    onReconnectStart={(_, edge) => { reconnecting.current = edge.id; }} onReconnectEnd={() => { reconnecting.current = null; }}
    onReconnect={(edge, c) => edit((p) => {
      const from = { componentId: c.source, pinId: c.sourceHandle ?? "" }, to = { componentId: c.target, pinId: c.targetHandle ?? "" };
      if (!validConnection({ ...p, wires: p.wires.filter((w) => w.id !== edge.id) }, from, to)) return p;
      return { ...p, wires: p.wires.map((w) => w.id === edge.id ? { ...w, from, to } : w) };
    })}
    onConnect={(c) => edit((p) => ({ ...p, wires: [...p.wires, { id: crypto.randomUUID(), from: { componentId: c.source, pinId: c.sourceHandle! }, to: { componentId: c.target, pinId: c.targetHandle! }, color: "blue" }] }))}
    onEdgesChange={(changes) => {
      useCanvas.getState().select(updateSelection(useCanvas.getState().selection, changes.flatMap((c) => c.type === "select" ? [{ id: c.id, selected: c.selected }] : [])));
    }}
    onEdgeClick={focusCanvas}
    onNodeClick={(event) => { if (!isEditingText(event.target) && !(event.target instanceof Element && event.target.closest("button"))) focusCanvas(); }}
    onBeforeDelete={async ({ nodes, edges }) => { useProject.getState().remove([...nodes.map((n) => n.id), ...edges.map((e) => e.id)]); useCanvas.getState().select([]); focusCanvas(); return false; }}
    nodeTypes={nodeTypes} onNodesChange={changeNodes}
    onNodeDragStart={() => { routing.controller.beginDrag(); useProject.getState().checkpoint(); setNotice(null); }}
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
      routing.controller.endDrag();
    }} onPaneClick={() => { setNotice(null); useCanvas.getState().select([]); focusCanvas(); }} viewport={viewport} onViewportChange={(viewport) => edit((p) => ({ ...p, viewport }), false)} minZoom={0.25} maxZoom={4} panOnDrag={area ? [1, 2] : true} zoomOnPinch selectionKeyCode="Shift" multiSelectionKeyCode={["Shift", "Control", "Meta"]} selectionOnDrag={area} selectionMode={SelectionMode.Partial} panActivationKeyCode="Space" deleteKeyCode={null} colorMode={resolvedTheme === "dark" ? "dark" : "light"}
    onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; }} onDrop={(e) => { e.preventDefault(); const type = e.dataTransfer.getData("application/vircuit-component"); if (catalog.some((c) => c.key === type)) useProject.getState().add(type, screenToFlowPosition({ x: e.clientX, y: e.clientY })); }}>
    <Background variant={BackgroundVariant.Dots} gap={20} color="var(--border-strong)" />
    <Controls />
    <TapWirePreview />
    {preview && <PlacementPreview {...preview} />}
    {(preview || notice) && <div role="status" className="pointer-events-none absolute inset-x-4 top-4 mx-auto max-w-md rounded border bg-surface px-3 py-2 text-xs text-text-secondary">{preview ? preview.placement.valid ? "Posisi cocok. Lepas untuk menyelaraskan; koneksi tetap memakai kabel." : preview.placement.reason : notice}</div>}
    {!nodes.length && <div className="pointer-events-none absolute inset-x-4 top-4 text-center text-xs text-text-secondary">Tambahkan komponen dari Parts untuk mulai merangkai.</div>}
  </ReactFlow></div></div>;
}
export function CircuitCanvas() { return <ReactFlowProvider><CanvasContent /></ReactFlowProvider>; }
