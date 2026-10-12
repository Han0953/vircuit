import { describe, expect, it } from "vitest";
import { chooseHardwareQuality, framedFov, nextHardwareQuality, qualityDpr } from "@/components/marketing/scenes/three/quality-policy";
import { createBoardGeometry } from "@/components/marketing/scenes/three/board-geometry";
import { sampleStory } from "@/components/marketing/scenes/story-config";
import { Euler, Matrix4, PerspectiveCamera, Quaternion, Vector3 } from "three";
describe("hardware quality and framing", () => {
  it("uses capability hints conservatively and honors reduced data", () => {
    expect(chooseHardwareQuality({})).toBe("medium");
    expect(chooseHardwareQuality({ cores: 12, memory: 8 })).toBe("high");
    expect(chooseHardwareQuality({ cores: 2, memory: 8 })).toBe("low");
    expect(chooseHardwareQuality({ cores: 12, memory: 8, saveData: true })).toBe("low");
    expect(["high", "medium", "low"].map((q) => nextHardwareQuality(q as "high" | "medium" | "low"))).toEqual(["medium", "low", "fallback"]);
    expect(qualityDpr("high", 3)).toBe(1.5);
    expect(qualityDpr("medium", 1)).toBe(1);
    expect(qualityDpr("low", 3)).toBe(.75);
    expect(framedFov(37, .6)).toBeGreaterThan(37);
    expect(framedFov(37, 1)).toBeCloseTo(37);
  });
  for (const board of ["uno", "nano", "esp32"] as const) it(`${board} low tier reduces triangles while preserving silhouette bounds`, () => {
    const high = createBoardGeometry(board), low = createBoardGeometry(board, "low");
    try {
      const triangles = (surfaces: typeof high) => surfaces.reduce((n, surface) => n + surface.geometry.getAttribute("position").count / 3, 0);
      expect(triangles(low)).toBeLessThan(triangles(high));
      expect(low.length).toBeLessThanOrEqual(6);
      const bounds = (surfaces: typeof high) => Math.max(...surfaces.map((surface) => surface.geometry.boundingBox!.max.x));
      expect(bounds(low)).toBeCloseTo(bounds(high));
    } finally { [...high, ...low].forEach((surface) => surface.geometry.dispose()); }
  });
  it("keeps the complete learning Uno and its connector in the narrow mobile stage", () => {
    const surfaces = createBoardGeometry("uno");
    try {
      for (const width of [310, 340, 380]) {
        const pose = sampleStory(.5, true), part = pose.objects.uno;
        const camera = new PerspectiveCamera(framedFov(31, width / 360, 1.5), width / 360, .1, 50);
        camera.position.set(...pose.camera); camera.lookAt(...pose.target); camera.updateMatrixWorld();
        const transform = new Matrix4().compose(new Vector3(...part.position), new Quaternion().setFromEuler(new Euler(...part.rotation)), new Vector3().setScalar(part.scale));
        for (const surface of surfaces) {
          const vertices = surface.geometry.getAttribute("position");
          for (let i = 0; i < vertices.count; i++) {
            const projected = new Vector3().fromBufferAttribute(vertices, i).applyMatrix4(transform).project(camera);
            expect(Math.abs(projected.x)).toBeLessThan(.98);
            expect(Math.abs(projected.y)).toBeLessThan(.98);
          }
        }
      }
    } finally { surfaces.forEach((surface) => surface.geometry.dispose()); }
  });
});
