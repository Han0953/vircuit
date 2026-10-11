import { describe, expect, it } from "vitest";
import { createCinematicChannel, featuredBoards, sampleCinematic } from "@/components/marketing/scenes/homepage-cinematic-config";
import { getDefinition } from "@/features/simulator/catalog/registry";

describe("homepage cinematic contract", () => {
  it("features real catalog boards without changing runtime support", () => {
    expect(featuredBoards).toEqual(["uno", "nano", "esp32"]);
    expect(getDefinition("nano").support).toBe("visual-only");
  });
  it("seeks three spotlight chapters deterministically in either direction", () => {
    for (const mobile of [true, false]) {
      for (const [p, board] of [[0, "uno"], [.32, "uno"], [.34, "nano"], [.66, "nano"], [.67, "esp32"], [1, "esp32"]] as const) {
        const frame = { zone: "boards" as const, progress: p, mobile };
        const before = sampleCinematic(frame);
        sampleCinematic({ ...frame, progress: 1 - p });
        expect(sampleCinematic(frame)).toEqual(before);
        expect(before.board).toBe(board);
      }
    }
  });
  it("keeps finite spotlight poses with smaller mobile travel", () => {
    const zone = "boards";
    for (const progress of [NaN, -1, 0, .1, .5, .9, 1, 3]) {
      const desktop = sampleCinematic({ zone, progress, mobile: false });
      const mobile = sampleCinematic({ zone, progress, mobile: true });
      expect([...desktop.position, ...desktop.rotation, ...desktop.camera, desktop.scale].every(Number.isFinite)).toBe(true);
      expect(Math.abs(mobile.position[0])).toBeLessThanOrEqual(Math.abs(desktop.position[0]));
    }
  });
  it("retains progress during renderer handoff and releases its listener", () => {
    const channel = createCinematicChannel(); let updates = 0;
    const off = channel.subscribe(() => updates++);
    channel.publish({ zone: "boards", progress: .5, mobile: false });
    expect(sampleCinematic(channel.read()).board).toBe("nano");
    off(); channel.publish({ zone: "boards", progress: .1, mobile: true });
    expect(updates).toBe(1);
  });
  it("keeps depth, rotation and camera movement alive inside a chapter without time-based loops", () => {
    const first = sampleCinematic({ zone: "boards", progress: .13, mobile: false });
    const second = sampleCinematic({ zone: "boards", progress: .2, mobile: false });
    expect(first.board).toBe(second.board);
    expect(first.position).not.toEqual(second.position);
    expect(first.rotation).not.toEqual(second.rotation);
    expect(first.camera).not.toEqual(second.camera);
    expect(first.target).not.toEqual(second.target);
  });
});
