import type { Anchor, Bounds } from "../ui/visuals/pin-layout";

export type Point = { x: number; y: number };
export type Direction = Anchor["side"];
export type Obstacle = Bounds & { id: string };
export type Port = Point & { side: Direction; owner?: string; bounds?: Bounds; surface?: boolean };
export type RoutingInput = { source: Port; target: Port; obstacles: readonly Obstacle[] };
export type Route = { points: Point[]; path: string; bounds: Bounds; status: "simple" | "astar" | "fallback" | "coincident"; explored: number };
export const routingConfig = { clearance: 8, escape: 12, bendPenalty: 24, maxStates: 8192, frameBudget: 4 } as const;
export const directions: Direction[] = ["right", "bottom", "left", "top"];
export const vectors: Record<Direction, Point> = { right: { x: 1, y: 0 }, bottom: { x: 0, y: 1 }, left: { x: -1, y: 0 }, top: { x: 0, y: -1 } };
