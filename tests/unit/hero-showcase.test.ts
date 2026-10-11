import { afterEach, describe, expect, it, vi } from "vitest";
import { createHeroPlayback, type HeroPlaybackState } from "@/components/marketing/scenes/hero-playback";
import { heroBoards, heroScenes, heroTiming, stageAnchor } from "@/components/marketing/scenes/hero-showcase-config";
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
  it("activates Uno, Nano and ESP32 on a five-second cadence, after exit completes", () => {
    vi.useFakeTimers(); const h = harness(); h.playback.start();
    expect(heroTiming.enter * 1000 + heroTiming.hold + heroTiming.exit * 1000).toBe(5000);
    for (const next of [1, 2, 0]) {
      vi.advanceTimersByTime(heroTiming.enter * 1000); h.complete();
      vi.advanceTimersByTime(heroTiming.hold - 1); expect(h.state().phase).toBe("holding");
      vi.advanceTimersByTime(1); expect(h.state().phase).toBe("exiting");
      expect(h.state().index).not.toBe(next);
      vi.advanceTimersByTime(heroTiming.exit * 1000); h.complete();
      expect(h.activate).toHaveBeenLastCalledWith(next);
    }
    h.playback.dispose(); expect(vi.getTimerCount()).toBe(0);
  });
  it("keeps the remaining hold when hidden and respects independent blockers", () => {
    vi.useFakeTimers(); const h = harness(); h.playback.start(); h.complete();
    vi.advanceTimersByTime(1000); h.playback.block("hidden", true); h.playback.block("offscreen", true);
    vi.advanceTimersByTime(20000); h.playback.block("hidden", false); expect(vi.getTimerCount()).toBe(0);
    h.playback.block("offscreen", false); vi.advanceTimersByTime(heroTiming.hold - 1001); expect(h.state().phase).toBe("holding");
    vi.advanceTimersByTime(1); expect(h.state().phase).toBe("exiting"); h.playback.dispose();
  });
  it("pauses and resumes the remaining hold without duplicating timers", () => {
    vi.useFakeTimers(); const h = harness(); h.playback.start(); h.complete();
    vi.advanceTimersByTime(1000); h.playback.pause();
    vi.advanceTimersByTime(20000);
    expect(h.state().manualPaused).toBe(true); expect(vi.getTimerCount()).toBe(0);
    h.playback.play(); h.playback.play(); expect(vi.getTimerCount()).toBe(1);
    vi.advanceTimersByTime(heroTiming.hold - 1000); expect(h.state().phase).toBe("exiting");
    h.playback.dispose(); h.complete(); expect(h.activate).toHaveBeenCalledTimes(1);
  });
  it("settles an interrupted transition and stays stable for reduced motion", () => {
    vi.useFakeTimers(); const h = harness(); h.playback.start(); h.complete();
    vi.advanceTimersByTime(heroTiming.hold); expect(h.state().phase).toBe("exiting");
    h.playback.reduce(true); expect(h.state().index).toBe(1); expect(h.state().phase).toBe("holding");
    h.complete(); h.playback.play(); vi.advanceTimersByTime(30000);
    expect(h.state().index).toBe(1); expect(vi.getTimerCount()).toBe(0);
    h.playback.dispose(); expect(vi.getTimerCount()).toBe(0);
  });
});
