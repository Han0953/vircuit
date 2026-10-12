import { describe, expect, it } from "vitest";
import { Mesh, MeshBasicMaterial, Raycaster, Vector3, PerspectiveCamera, Matrix4, Euler, Quaternion } from "three";
import { createBoardGeometry } from "@/components/marketing/scenes/three/board-geometry";
import { featuredBoards, sampleCinematic } from "@/components/marketing/scenes/homepage-cinematic-config";
import { unoPins } from "@/components/marketing/scenes/three/hardware-layout";
import { boardPrintSurfaces } from "@/components/marketing/scenes/three/board-lettering";

describe("marketing hardware geometry", () => {
  for (const type of featuredBoards) it(`${type} prints a recognizable name and package markings inside its surfaces`, () => {
    const surfaces = boardPrintSurfaces(type);
    expect(surfaces).toHaveLength(2);
    expect(surfaces.flatMap(({ labels }) => labels.map(({ text }) => text)).join(" ")).toContain(type.toUpperCase());
    for (const surface of surfaces) for (const label of surface.labels) {
      expect([surface.width, surface.length, surface.y, label.x, label.z, label.size].every(Number.isFinite)).toBe(true);
      expect(label.size).toBeGreaterThan(0);
      expect(Math.abs(label.x - surface.x) + label.text.length * label.size * .3).toBeLessThan(surface.width / 2);
      expect(Math.abs(label.z - surface.z) + label.size / 2).toBeLessThan(surface.length / 2);
    }
  });
  for (const type of featuredBoards) it(`${type} keeps detailed geometry finite and batched within the mobile budget`, () => {
    const surfaces = createBoardGeometry(type);
    try {
      expect(surfaces.length).toBeLessThanOrEqual(6);
      expect(new Set(surfaces.map((surface) => surface.finish)).size).toBe(surfaces.length);
      const triangles = surfaces.reduce((sum, { geometry }) => sum + geometry.getAttribute("position").count / 3, 0);
      expect(triangles).toBeLessThan(6000);
      for (const { geometry } of surfaces) {
        expect([...geometry.getAttribute("position").array].every(Number.isFinite)).toBe(true);
        expect(geometry.boundingSphere!.radius).toBeLessThan(3);
        expect(geometry.getAttribute("normal").count).toBe(geometry.getAttribute("position").count);
      }
    } finally { surfaces.forEach(({ geometry }) => geometry.dispose()); }
  });
  it("cuts mounting holes through both Uno PCB and laminate rather than covering them", () => {
    const surfaces = createBoardGeometry("uno");
    const material = new MeshBasicMaterial();
    try {
      const board = surfaces.filter(({ finish }) => finish === "pcb" || finish === "substrate").map(({ geometry }) => new Mesh(geometry, material));
      for (const [x, z] of [[-1.53, -1.14], [-1.53, 1.14], [1.51, -.95], [1.24, 1.12]]) {
        expect(new Raycaster(new Vector3(x, 1, z), new Vector3(0, -1, 0)).intersectObjects(board)).toHaveLength(0);
      }
      expect(new Raycaster(new Vector3(.9, 1, -.8), new Vector3(0, -1, 0)).intersectObjects(board).length).toBeGreaterThan(0);
    } finally { material.dispose(); surfaces.forEach(({ geometry }) => geometry.dispose()); }
  });
  it("keeps canonical story pin anchors inside open Uno header rims", () => {
    const surfaces = createBoardGeometry("uno");
    const material = new MeshBasicMaterial();
    try {
      const metal = surfaces.filter(({ finish }) => finish === "metal").map(({ geometry }) => new Mesh(geometry, material));
      for (const [x, y, z] of Object.values(unoPins)) {
        // An output wire enters a socket, not a solid cap in front of its endpoint.
        expect(new Raycaster(new Vector3(x, y + .1, z), new Vector3(0, -1, 0), 0, .11).intersectObjects(metal)).toHaveLength(0);
      }
    } finally { material.dispose(); surfaces.forEach(({ geometry }) => geometry.dispose()); }
  });
  it("fits complete connector and pin bounds in the held desktop and mobile spotlight", () => {
    for (const [progress, type] of [[.15, "uno"], [.5, "nano"], [.84, "esp32"]] as const) {
      const surfaces = createBoardGeometry(type);
      try {
        for (const [width, height, mobile] of [[632, 700, false], [358, 254, true]] as const) {
          const pose = sampleCinematic({ zone: "boards", progress, mobile });
          const camera = new PerspectiveCamera(width / height < 1 ? 37 : 32, width / height, .1, 50);
          camera.position.set(...pose.camera); camera.lookAt(...pose.target); camera.updateMatrixWorld();
          const transform = new Matrix4().compose(new Vector3(...pose.position), new Quaternion().setFromEuler(new Euler(...pose.rotation)), new Vector3().setScalar(pose.scale));
          // Project actual vertices: a combined AABB includes empty space outside
          // the irregular Uno outline and can incorrectly report clipping.
          const point = new Vector3(); let maxX = 0, maxY = 0;
          for (const { geometry } of surfaces) {
            const vertices = geometry.getAttribute("position");
            for (let i = 0; i < vertices.count; i++) {
              point.fromBufferAttribute(vertices, i).applyMatrix4(transform).project(camera);
              maxX = Math.max(maxX, Math.abs(point.x)); maxY = Math.max(maxY, Math.abs(point.y));
            }
          }
          expect(maxX, `${type}, ${width}px horizontal framing`).toBeLessThan(.99);
          expect(maxY, `${type}, ${width}px vertical framing`).toBeLessThan(.99);
        }
      } finally { surfaces.forEach(({ geometry }) => geometry.dispose()); }
    }
  });
});
