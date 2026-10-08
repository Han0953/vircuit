import { PriorityQueue } from "./priority-queue";
import { candidates, distance, equal, escapePorts, intersects, previewRoute, routeCost, routeResult, simplify } from "./route-geometry";
import { routingConfig, type Point, type Route, type RoutingInput } from "./types";

const reverse = (a: Point, b: Point, c: Point) => (b.x - a.x) * (c.x - b.x) + (b.y - a.y) * (c.y - b.y) < 0;

function validPath(points: Point[], input: RoutingInput) {
  const path = simplify(points);
  for (let i = 1; i < path.length; i++) {
    if (i > 1 && reverse(path[i - 2], path[i - 1], path[i])) return false;
    if (input.obstacles.some((obstacle) => {
      if (i === 1 && obstacle.id === input.source.owner) return false;
      if (i === path.length - 1 && obstacle.id === input.target.owner) return false;
      return intersects(path[i - 1], path[i], obstacle);
    })) return false;
  }
  // Simplification must never reverse a port's original escape direction.
  const a = points[1], b = points[points.length - 2];
  const first = path[1], last = path[path.length - 2];
  return (a.x - input.source.x) * (first.x - input.source.x) + (a.y - input.source.y) * (first.y - input.source.y) > 0
    && (b.x - input.target.x) * (last.x - input.target.x) + (b.y - input.target.y) * (last.y - input.target.y) > 0;
}

type SearchNode = { ix: number; iy: number; direction: number; cost: number; priority: number; order: number; parent?: SearchNode };
const steps = [[1, 0], [0, 1], [-1, 0], [0, -1]] as const;

function* search(input: RoutingInput, source: Point, target: Point, budget: number): Generator<void, { points?: Point[]; explored: number }> {
  const xs = [source.x, target.x], ys = [source.y, target.y];
  for (const obstacle of input.obstacles) {
    xs.push(obstacle.x, obstacle.x + obstacle.width); ys.push(obstacle.y, obstacle.y + obstacle.height);
  }
  const margin = routingConfig.escape * 2;
  xs.push(Math.min(...xs) - margin, Math.max(...xs) + margin);
  ys.push(Math.min(...ys) - margin, Math.max(...ys) + margin);
  const x = [...new Set(xs)].sort((a, b) => a - b), y = [...new Set(ys)].sort((a, b) => a - b);
  const queue = new PriorityQueue<SearchNode>();
  const costs = new Map<number, number>();
  const key = (ix: number, iy: number, direction: number) => (iy * x.length + ix) * 5 + direction;
  let order = 0, explored = 0;
  queue.push({ ix: x.indexOf(source.x), iy: y.indexOf(source.y), direction: 4, cost: 0, priority: distance(source, target), order: order++ });
  while (explored < budget) {
    const node = queue.pop();
    if (!node) break;
    if (node.cost > (costs.get(key(node.ix, node.iy, node.direction)) ?? Infinity)) continue;
    explored++;
    if (explored % 8 === 0) yield;
    const point = { x: x[node.ix], y: y[node.iy] };
    if (equal(point, target)) {
      const previous = node.parent ? { x: x[node.parent.ix], y: y[node.parent.iy] } : source;
      if (!reverse(previous, target, input.target)) {
        const path: Point[] = [];
        for (let current: SearchNode | undefined = node; current; current = current.parent) path.push({ x: x[current.ix], y: y[current.iy] });
        return { points: path.reverse(), explored };
      }
    }
    for (let direction = 0; direction < steps.length; direction++) {
      if (node.direction !== 4 && (direction + 2) % 4 === node.direction) continue;
      const [dx, dy] = steps[direction], ix = node.ix + dx, iy = node.iy + dy;
      if (ix < 0 || iy < 0 || ix >= x.length || iy >= y.length) continue;
      const next = { x: x[ix], y: y[iy] };
      if (node.direction === 4 && reverse(input.source, source, next)) continue;
      if (input.obstacles.some((obstacle) => intersects(point, next, obstacle))) continue;
      const cost = node.cost + distance(point, next) + (node.direction !== 4 && node.direction !== direction ? routingConfig.bendPenalty : 0);
      const id = key(ix, iy, direction);
      if (cost >= (costs.get(id) ?? Infinity)) continue;
      costs.set(id, cost);
      queue.push({ ix, iy, direction, cost, priority: cost + distance(next, target), order: order++, parent: node });
    }
  }
  return { explored };
}

export function* routeWireSteps(input: RoutingInput, maxStates: number = routingConfig.maxStates): Generator<void, Route> {
  if (equal(input.source, input.target)) return routeResult([input.source], "coincident");
  const pairs = escapePorts(input.source).flatMap((a) => escapePorts(input.target).map((b) => ({ a, b })));
  const options = pairs.flatMap(({ a, b }) => candidates(a, b).map((middle) => [input.source, ...middle, input.target]));
  options.sort((a, b) => routeCost(a) - routeCost(b));
  let checked = 0;
  for (const points of options) {
    if (checked++ % 8 === 0) yield;
    if (validPath(points, input)) return routeResult(points, "simple");
  }
  let explored = 0;
  for (const { a, b } of pairs) {
    if (explored >= maxStates) break;
    const stubsValid = input.obstacles.every((o) => (o.id === input.source.owner || !intersects(input.source, a, o)) && (o.id === input.target.owner || !intersects(b, input.target, o)));
    if (!stubsValid) continue;
    const result = yield* search(input, a, b, maxStates - explored);
    explored += result.explored;
    if (result.points) {
      const points = [input.source, ...result.points, input.target];
      if (validPath(points, input)) return routeResult(points, "astar", explored);
    }
  }
  return { ...previewRoute(input.source, input.target), status: "fallback", explored };
}

export function routeWire(input: RoutingInput, maxStates?: number): Route {
  const task = routeWireSteps(input, maxStates);
  let result = task.next();
  while (!result.done) result = task.next();
  return result.value;
}
