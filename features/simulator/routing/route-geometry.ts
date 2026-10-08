import { routingConfig, vectors, directions, type Point, type Port, type Route, type Obstacle } from "./types";

export const equal = (a: Point, b: Point) => a.x === b.x && a.y === b.y;
export const distance = (a: Point, b: Point) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

export function simplify(points: readonly Point[]): Point[] {
  const result: Point[] = [];
  for (const point of points) {
    if (result.length && equal(result[result.length - 1], point)) continue;
    while (result.length > 1) {
      const a = result[result.length - 2], b = result[result.length - 1];
      const straight = (a.x === b.x && b.x === point.x) || (a.y === b.y && b.y === point.y);
      if (!straight || (b.x - a.x) * (point.x - b.x) + (b.y - a.y) * (point.y - b.y) < 0) break;
      result.pop();
    }
    result.push({ x: point.x, y: point.y });
  }
  return result;
}

export function routeResult(points: readonly Point[], status: Route["status"], explored = 0): Route {
  const clean = simplify(points);
  const xs = clean.map((p) => p.x), ys = clean.map((p) => p.y);
  const x = Math.min(...xs), y = Math.min(...ys);
  return { points: clean, status, explored, path: clean.map((p, i) => `${i ? "L" : "M"}${p.x} ${p.y}`).join(" "), bounds: { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y } };
}

export function escapePorts(port: Port): Point[] {
  const sides = port.surface ? [port.side, ...directions.filter((side) => side !== port.side)] : [port.side];
  return sides.map((side) => {
    const v = vectors[side];
    let length: number = routingConfig.escape;
    if (port.bounds && !port.surface) {
      const b = port.bounds;
      const toEdge = side === "left" ? port.x - b.x : side === "right" ? b.x + b.width - port.x : side === "top" ? port.y - b.y : b.y + b.height - port.y;
      length = Math.max(length, toEdge + routingConfig.clearance);
    }
    return { x: port.x + v.x * length, y: port.y + v.y * length };
  });
}

export function candidates(a: Point, b: Point): Point[][] {
  const midX = (a.x + b.x) / 2, midY = (a.y + b.y) / 2;
  const margin = routingConfig.escape * 2;
  return [
    ...(a.x === b.x || a.y === b.y ? [[a, b]] : []),
    [a, { x: b.x, y: a.y }, b], [a, { x: a.x, y: b.y }, b],
    ...[midX, Math.min(a.x, b.x) - margin, Math.max(a.x, b.x) + margin].map((x) => [a, { x, y: a.y }, { x, y: b.y }, b]),
    ...[midY, Math.min(a.y, b.y) - margin, Math.max(a.y, b.y) + margin].map((y) => [a, { x: a.x, y }, { x: b.x, y }, b]),
  ];
}

export function routeCost(points: readonly Point[]) {
  const clean = simplify(points);
  return clean.slice(1).reduce((sum, point, i) => sum + distance(clean[i], point), 0) + Math.max(0, clean.length - 2) * routingConfig.bendPenalty;
}

export function intersects(a: Point, b: Point, rectangle: Obstacle): boolean {
  const right = rectangle.x + rectangle.width, bottom = rectangle.y + rectangle.height;
  if (a.x === b.x) return a.x > rectangle.x && a.x < right && Math.max(a.y, b.y) > rectangle.y && Math.min(a.y, b.y) < bottom;
  if (a.y === b.y) return a.y > rectangle.y && a.y < bottom && Math.max(a.x, b.x) > rectangle.x && Math.min(a.x, b.x) < right;
  return true;
}

export function previewRoute(source: Port, target: Port): Route {
  if (equal(source, target)) return routeResult([source], "coincident");
  const a = escapePorts(source)[0], b = escapePorts(target)[0];
  const options = candidates(a, b).map((middle) => [source, ...middle, target]);
  options.sort((left, right) => routeCost(left) - routeCost(right));
  const readable = options.find((points) => {
    const path = simplify(points);
    return path.every((p, i) => i < 2 || (p.x - path[i - 1].x) * (path[i - 1].x - path[i - 2].x) + (p.y - path[i - 1].y) * (path[i - 1].y - path[i - 2].y) >= 0);
  });
  return routeResult(readable ?? options[0], "fallback");
}
