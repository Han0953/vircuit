import type { ComponentInstance, Wire } from "../types/project";
import { equal, previewRoute } from "./route-geometry";
import { routeWireSteps } from "./orthogonal-router";
import { buildRoutingScene, geometrySignature, wireInput, type GeometryCache, type RoutingScene } from "./routing-scene";
import { routingConfig, type Route } from "./types";

export type RoutingSnapshot = { routes: ReadonlyMap<string, Route>; pending: number; revision: number };
export type RoutingClock = { request: (callback: () => void) => number; cancel: (id: number) => void; now: () => number };
const browserClock: RoutingClock = { request: (callback) => requestAnimationFrame(callback), cancel: (id) => cancelAnimationFrame(id), now: () => performance.now() };

export class RoutingController {
  private snapshot: RoutingSnapshot = { routes: new Map(), pending: 0, revision: 0 };
  private listeners = new Set<() => void>();
  private geometry: GeometryCache = new Map();
  private scene?: RoutingScene;
  private wires: readonly Wire[] = [];
  private cache = new Map<string, { signature: string; route: Route }>();
  private frame?: number;
  private generation = 0;
  private dragging = false;
  readonly stats = { frames: 0, maxBatchMs: 0, searchMs: 0, cacheHits: 0, completed: 0, fallbacks: 0 };

  constructor(private clock: RoutingClock = browserClock) {}
  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  private publish(routes: ReadonlyMap<string, Route>, pending: number) {
    this.snapshot = { routes, pending, revision: this.snapshot.revision + 1 };
    for (const listener of this.listeners) listener();
  }
  private cancel() {
    this.generation++;
    if (this.frame !== undefined) this.clock.cancel(this.frame);
    this.frame = undefined;
  }
  dispose() { this.cancel(); this.geometry.clear(); this.cache.clear(); this.scene = undefined; this.dragging = false; }
  beginDrag() { this.dragging = true; this.cancel(); }
  endDrag() { this.dragging = false; this.schedule(); }

  update(components: readonly ComponentInstance[], wires: readonly Wire[]) {
    const signature = geometrySignature(components, wires);
    if (this.scene?.signature === signature) return;
    this.cancel();
    this.scene = buildRoutingScene(components, wires, this.geometry);
    this.wires = [...wires].sort((a, b) => a.id.localeCompare(b.id));
    const routes = new Map<string, Route>();
    for (const wire of this.wires) {
      const input = wireInput(this.scene, wire);
      if (!input) continue;
      const previous = this.snapshot.routes.get(wire.id);
      const keep = this.dragging && previous && equal(previous.points[0], input.source) && equal(previous.points[previous.points.length - 1], input.target);
      routes.set(wire.id, keep ? previous : previewRoute(input.source, input.target));
    }
    const present = new Set(wires.map((w) => w.id));
    for (const id of this.cache.keys()) if (!present.has(id)) this.cache.delete(id);
    this.publish(routes, this.dragging ? 0 : routes.size);
    if (!this.dragging) this.schedule();
  }

  private schedule() {
    this.cancel();
    if (!this.scene) return;
    const scene = this.scene, generation = this.generation;
    const routes = new Map(this.snapshot.routes);
    const jobs: { id: string; task: Generator<void, Route> }[] = [];
    for (const wire of this.wires) {
      const cached = this.cache.get(wire.id);
      if (cached?.signature === scene.signature) { routes.set(wire.id, cached.route); this.stats.cacheHits++; continue; }
      const input = wireInput(scene, wire);
      if (input) jobs.push({ id: wire.id, task: routeWireSteps(input) });
    }
    this.publish(routes, jobs.length);
    if (!jobs.length) return;
    let index = 0;
    const batch = () => {
      if (generation !== this.generation) return;
      this.frame = undefined;
      const start = this.clock.now();
      do {
        const job = jobs[index], result = job.task.next();
        if (generation !== this.generation) return;
        if (result.done) {
          routes.set(job.id, result.value);
          this.cache.set(job.id, { signature: scene.signature, route: result.value });
          this.stats.completed++; if (result.value.status === "fallback") this.stats.fallbacks++;
          index++;
        }
      } while (index < jobs.length && this.clock.now() - start < routingConfig.frameBudget);
      const elapsed = this.clock.now() - start;
      this.stats.frames++; this.stats.searchMs += elapsed; this.stats.maxBatchMs = Math.max(this.stats.maxBatchMs, elapsed);
      this.publish(new Map(routes), jobs.length - index);
      if (index < jobs.length) this.frame = this.clock.request(batch);
    };
    this.frame = this.clock.request(batch);
  }
}
