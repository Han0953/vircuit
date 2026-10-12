import { describe, expect, it } from "vitest";
import { catalog } from "@/features/simulator/catalog/registry";
import { componentMotion, primaryTypes, secondaryTypes } from "@/components/marketing/scenes/component-motion-registry";
import { assembled, createStoryChannel, sampleStory, storySegments } from "@/components/marketing/scenes/story-config";
import { storyWireRoutes, unoHeaderPads, unoPins } from "@/components/marketing/scenes/three/hardware-layout";
describe("homepage motion contract", () => {
  it("attaches story wire endpoints to the same canonical Uno pads used by the model", () => {
    expect(storyWireRoutes).toHaveLength(8);
    for (const anchor of Object.values(unoPins)) expect(unoHeaderPads).toContainEqual(anchor);
    expect(storyWireRoutes[0][0]).toEqual(unoPins.D3.map((value, axis) => value + assembled.uno[axis]));
    expect(storyWireRoutes[2].at(-1)).toEqual(unoPins.GND.map((value, axis) => value + assembled.uno[axis]));
    for (const p of [.15, .3, .5, .7, .9]) {
      const before = sampleStory(p - .00001), after = sampleStory(p + .00001);
      expect(Math.max(...before.camera.map((value, axis) => Math.abs(value - after.camera[axis])))).toBeLessThan(.001);
    }
  });
  it("keeps the curated marketing showcase valid as the simulator catalog expands", () => {
    expect(Object.keys(componentMotion).sort()).toEqual([...primaryTypes, ...secondaryTypes].sort());
    for (const type of Object.keys(componentMotion)) expect(catalog.some((c) => c.key === type)).toBe(true);
    expect(Object.values(componentMotion).filter((c) => c.renderer === "webgl")).toHaveLength(6);
    for (const motion of Object.values(componentMotion)) {
      expect(motion.range[0]).toBeLessThan(motion.range[1]);
      expect(motion.fallback).toBe("svg"); expect(motion.reduced).toBe("assembled");
    }
  });
  it("is reversible, finite and assembles at every responsive size", () => {
    for (const mobile of [false, true]) for (const p of storySegments) {
      const forward = sampleStory(p, mobile);
      sampleStory(1 - p, mobile);
      expect(sampleStory(p, mobile)).toEqual(forward);
      expect(forward.camera.every(Number.isFinite)).toBe(true);
    }
    for (const type of primaryTypes) expect(sampleStory(1).objects[type].position).toEqual(assembled[type]);
    expect(sampleStory(.75).diagnostic).toBe(true); expect(sampleStory(.9).diagnostic).toBe(false);
    expect(sampleStory(.3).wire).toBe(0); expect(sampleStory(.5).wire).toBe(1);
    expect(sampleStory(NaN).p).toBe(0);
  });
  it("keeps one progress across renderer switches and releases subscriptions", () => {
    const channel = createStoryChannel(); let count = 0;
    const off = channel.subscribe(() => count++);
    channel.publish(.7); channel.setWebgl(true);
    expect(channel.read()).toEqual({ progress: .7, webgl: true });
    off(); channel.publish(.2); expect(count).toBe(2);
  });
});
