import { afterEach, describe, expect, it, vi } from "vitest";
import { createHeroPlayback, type HeroPlaybackState } from "@/components/marketing/scenes/hero-playback";
import { heroBoards, heroScenes, stageAnchor } from "@/components/marketing/scenes/hero-showcase-config";
import { getDefinition } from "@/features/simulator/catalog/registry";
import { visualLayout } from "@/features/simulator/ui/visuals/pin-layout";

function harness() {
  let state: HeroPlaybackState;
  const callbacks: (() => void)[] = [];
  const activate = vi.fn(), kill = vi.fn(), pause = vi.fn(), resume = vi.fn();
  const animation = (_index: number, done: () => void) => { callbacks.push(done); return { kill, pause, resume }; };
  const playback = createHeroPlayback({ activate, enter: animation, exit: animation, settle: vi.fn(), changed: (next) => { state = next; } });
  return { playback, activate, kill, pause, resume, complete: () => callbacks.shift()!(), state: () => state! };
}
afterEach(() => vi.useRealTimers());
describe("hero circuit stage", () => {
  it("uses available output and ground anchors inside each board frame", () => {
    for (const type of heroBoards) {
      const scene = heroScenes[type], definition = getDefinition(type), layout = visualLayout(definition);
      for (const id of [scene.pin, "GND"]) {
        const anchor = layout.anchors.find((entry) => entry.pin.id === id)!;
        expect(anchor).toBeDefined();
        const point = stageAnchor(scene.frame, layout, anchor);
        expect(point.x).toBeGreaterThan(scene.frame.x);
        expect(point.x).toBeLessThan(scene.frame.x + scene.frame.width);
        expect(point.y).toBeGreaterThan(scene.frame.y);
        expect(point.y).toBeLessThan(scene.frame.y + scene.frame.height);
      }
    }
    expect(getDefinition("nano").support).toBe("visual-only");
    expect(heroScenes.nano.status).toBe("Visual saja");
    expect(heroScenes.esp32.pin).toBe("GPIO23");
  });
  it("cycles only after a readable hold and finishes exit before activation", () => {
    vi.useFakeTimers(); const h = harness(); h.playback.start(); h.complete();
    vi.advanceTimersByTime(4949); expect(h.state().phase).toBe("holding");
    vi.advanceTimersByTime(1); expect(h.state().phase).toBe("exiting"); expect(h.activate).toHaveBeenCalledTimes(1);
    h.complete(); expect(h.activate).toHaveBeenLastCalledWith(1); h.complete();
    h.playback.dispose(); expect(vi.getTimerCount()).toBe(0);
  });
  it("keeps the remaining hold when hidden and respects independent blockers", () => {
    vi.useFakeTimers(); const h = harness(); h.playback.start(); h.complete();
    vi.advanceTimersByTime(1000); h.playback.block("hidden", true); h.playback.block("offscreen", true);
    vi.advanceTimersByTime(20000); h.playback.block("hidden", false); expect(vi.getTimerCount()).toBe(0);
    h.playback.block("offscreen", false); vi.advanceTimersByTime(3949); expect(h.state().phase).toBe("holding");
    vi.advanceTimersByTime(1); expect(h.state().phase).toBe("exiting"); h.playback.dispose();
  });
  it("lets the latest manual choice win without stale callbacks or duplicate exits", () => {
    vi.useFakeTimers(); const h = harness(); h.playback.start();
    h.playback.select(1); h.playback.select(2); h.playback.select(2);
    h.complete(); expect(h.state().phase).toBe("exiting");
    h.complete(); expect(h.activate).toHaveBeenLastCalledWith(2); h.complete();
    expect(h.state().manualPaused).toBe(true); expect(vi.getTimerCount()).toBe(0);
    h.playback.play(); expect(vi.getTimerCount()).toBe(1); h.playback.dispose();
  });
  it("allows manual transitions while hovered and disables autoplay for reduced motion", () => {
    vi.useFakeTimers(); const h = harness(); h.playback.start(); h.complete();
    h.playback.block("hover", true); h.playback.select(1); expect(h.pause).not.toHaveBeenCalled();
    h.playback.reduce(true); expect(h.state().index).toBe(1); expect(h.state().phase).toBe("holding");
    h.playback.select(2); expect(h.state().index).toBe(2); h.playback.play(); expect(vi.getTimerCount()).toBe(0);
    h.playback.dispose(); h.complete(); expect(vi.getTimerCount()).toBe(0);
  });
});
