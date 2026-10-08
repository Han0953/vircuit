import { getDefinition } from "../catalog/registry";
import type { ComponentInstance } from "../types/project";
import { visualLayout, visualPitch, type Anchor } from "../ui/visuals/pin-layout";
import { worldPins } from "./component-geometry";
export { worldPins } from "./component-geometry";

export const snapTolerance = visualPitch * 0.55;
export const footprintTypes = ["led", "resistor", "button"] as const;
export function hasFootprint(type: string) { return footprintTypes.some((key) => key === type); }
export function componentFootprint(type: string) {
  if (!hasFootprint(type)) return null;
  const definition = getDefinition(type);
  return { pins: visualLayout(definition).anchors, orientations: [0, 90, 180, 270] as const, tolerance: snapTolerance };
}
export type HoleAlignment = { pinId: string; holeId: string; x: number; y: number };
export type Placement = { valid: true; position: { x: number; y: number }; breadboardId: string; holes: HoleAlignment[] } | { valid: false; reason: string };
const key = (point: { x: number; y: number }) => `${point.x.toFixed(4)},${point.y.toFixed(4)}`;
const terminal = (a: Anchor) => /^[A-J]\d+$/.test(a.pin.id);

export function findBreadboardPlacement(component: ComponentInstance, components: ComponentInstance[]): Placement | null {
  if (!hasFootprint(component.type)) return null;
  const pins = worldPins(component);
  let nearest: (Placement & { valid: true }) | undefined;
  let distance = snapTolerance;
  let invalid: string | undefined;
  for (const board of components.filter((c) => c.type.startsWith("breadboard-"))) {
    const definition = getDefinition(board.type);
    const boardPins = worldPins(board);
    const holes = boardPins.filter(terminal);
    if (boardPins.some((hole) => !terminal(hole) && Math.hypot(hole.x - pins[0].x, hole.y - pins[0].y) <= snapTolerance)) invalid ??= "Snap hanya tersedia pada terminal strip, bukan power rail.";
    const byPoint = new Map(holes.map((hole) => [key(hole), hole]));
    const groupByHole = new Map(definition.groups!.flatMap((group, i) => group.map((id) => [id, i] as const)));
    const occupied = new Set<string>();
    for (const other of components) {
      if (other.id === component.id || !hasFootprint(other.type)) continue;
      const otherHoles = worldPins(other).map((p) => byPoint.get(key(p)));
      if (otherHoles.every((h) => h !== undefined)) for (const hole of otherHoles) occupied.add(hole!.pin.id);
    }
    for (const anchor of holes) {
      const dx = anchor.x - pins[0].x, dy = anchor.y - pins[0].y;
      const delta = Math.hypot(dx, dy);
      if (delta > snapTolerance) continue;
      const matches = pins.map((pin) => byPoint.get(key({ x: pin.x + dx, y: pin.y + dy })));
      if (matches.some((hole) => !hole)) { invalid ??= "Kaki belum cocok dengan lubang terminal breadboard."; continue; }
      const matched = matches.filter((hole): hole is Anchor => hole !== undefined);
      if (new Set(matched.map((h) => groupByHole.get(h.pin.id))).size !== matched.length) { invalid ??= "Pilih lubang pada jalur berbeda agar kedua terminal tidak tersambung langsung."; continue; }
      if (matched.some((h) => occupied.has(h.pin.id))) { invalid ??= "Lubang sudah digunakan komponen lain. Pilih posisi berbeda."; continue; }
      if (delta <= distance) {
        distance = delta;
        nearest = { valid: true, position: { x: component.position.x + dx, y: component.position.y + dy }, breadboardId: board.id, holes: matched.map((hole, i) => ({ pinId: pins[i].pin.id, holeId: hole.pin.id, x: hole.x, y: hole.y })) };
      }
    }
  }
  return nearest ?? (invalid ? { valid: false, reason: invalid } : null);
}
