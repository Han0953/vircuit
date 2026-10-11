import { BoxGeometry, BufferGeometry, CylinderGeometry, ExtrudeGeometry, Matrix4, Path, Quaternion, RingGeometry, Shape, Vector3, Euler } from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type { FeaturedBoard } from "../homepage-cinematic-config";
import type { Vector } from "../story-config";
import { unoHeaderPads } from "./hardware-layout";

type Finish = "pcb" | "substrate" | "chip" | "metal" | "gold" | "silkscreen";
export type BoardSurface = { finish: Finish; geometry: BufferGeometry };

/** Static hardware is baked by finish, including leads and connector walls.
 * Detail count does not become draw-call count. No simulator geometry is changed.
 */
export function createBoardGeometry(type: FeaturedBoard): BoardSurface[] {
  const buckets = new Map<Finish, BufferGeometry[]>();
  const box = new BoxGeometry();
  const cylinder = new CylinderGeometry(1, 1, 1, 16);
  const ring = new RingGeometry(.55, 1, 16);
  const matrix = new Matrix4(), quaternion = new Quaternion();
  const add = (source: BufferGeometry, finish: Finish, position: Vector, scale: Vector, rotation: Vector = [0, 0, 0]) => {
    quaternion.setFromEuler(new Euler(...rotation));
    matrix.compose(new Vector3(...position), quaternion, new Vector3(...scale));
    const geometry = source.index ? source.toNonIndexed() : source.clone();
    geometry.applyMatrix4(matrix);
    const batch = buckets.get(finish) ?? [];
    batch.push(geometry); buckets.set(finish, batch);
  };
  const block = (finish: Finish, position: Vector, scale: Vector, rotation?: Vector) => add(box, finish, position, scale, rotation);
  const round = (finish: Finish, position: Vector, scale: Vector, rotation?: Vector) => add(cylinder, finish, position, scale, rotation);
  const pad = (position: Vector, radius = .057) => add(ring, "gold", position, [radius, radius, 1], [-Math.PI / 2, 0, 0]);
  const smd = (x: number, z: number, length = .13, width = .06, ceramic = false) => {
    block("chip", [x, .105, z], [length, .055, width]);
    for (const side of [-1, 1]) block(ceramic ? "gold" : "metal", [x + side * length * .43, .105, z], [length * .2, .057, width * 1.05]);
  };
  const outline = (points: [number, number][], holes: [number, number][]) => {
    const shape = new Shape();
    points.forEach(([x, z], i) => i ? shape.lineTo(x, -z) : shape.moveTo(x, -z)); shape.closePath();
    for (const [x, z] of holes) { const hole = new Path(); hole.absarc(x, -z, .068, 0, Math.PI * 2, true); shape.holes.push(hole); }
    const geometry = new ExtrudeGeometry(shape, { depth: .09, bevelEnabled: false, curveSegments: 8 });
    geometry.rotateX(-Math.PI / 2);
    add(geometry, type === "esp32" ? "chip" : "pcb", [0, 0, 0], [1, 1, 1]);
    // Visible laminate edge below the solder mask, following the same cutouts.
    add(geometry, "substrate", [0, -.025, 0], [1, .22, 1]);
    holes.forEach(([x, z]) => pad([x, .092, z], .093));
    geometry.dispose();
  };
  const usb = (x: number, z: number, width: number, height: number, depth: number, side: boolean) => {
    const p = (u: number, y: number, v: number): Vector => side ? [x - v, y, z + u] : [x + u, y, z + v];
    const s = (u: number, y: number, v: number): Vector => side ? [v, y, u] : [u, y, v];
    const y = .09 + height / 2;
    block("chip", p(0, y, -depth * .22), s(width * .85, height * .8, depth * .5));
    block("metal", p(0, y + height / 2, 0), s(width, .035, depth));
    for (const edge of [-1, 1]) {
      block("metal", p(edge * (width / 2 - .02), y, 0), s(.04, height, depth));
      block("metal", p(edge * width * .6, .105, -depth * .28), s(.13, .035, .16));
      block("chip", p(edge * width * .23, y + height / 2 + .02, -.035), s(width * .19, .008, depth * .2));
    }
    block("metal", p(0, .105, 0), s(width, .035, depth));
    block("silkscreen", p(0, .12 + height * .24, depth * .12), s(width * .64, .04, depth * .56));
    for (let i = 0; i < (side ? 4 : 5); i++) block("gold", p(-width * .22 + i * width * .11, .145 + height * .24, depth * .21), s(.022, .012, depth * .27));
  };
  const qfp = (x: number, z: number, width: number, count: number, angle = 0) => {
    const local = (px: number, y: number, pz: number): Vector => [x + px * Math.cos(angle) + pz * Math.sin(angle), y, z - px * Math.sin(angle) + pz * Math.cos(angle)];
    block("chip", local(0, .18, 0), [width, .16, width], [0, angle, 0]);
    block("substrate", local(0, .101, 0), [width + .09, .025, width + .09], [0, angle, 0]);
    for (let i = 0; i < count; i++) for (const side of [-1, 1]) {
      const along = (i - (count - 1) / 2) * width / count;
      block("metal", local(side * (width / 2 + .035), .135, along), [.1, .03, .025], [0, angle, 0]);
      block("metal", local(along, .135, side * (width / 2 + .035)), [.025, .03, .1], [0, angle, 0]);
    }
    round("silkscreen", local(-width * .31, .263, -width * .31), [.018, .004, .018]);
    for (const offset of [-.04, .02]) block("silkscreen", local(.02, .263, offset), [width * .36, .004, .012], [0, angle, 0]);
  };
  if (type === "uno") {
    outline([[-1.69, -1.333], [1.365, -1.333], [1.69, -1.118], [1.69, .95], [1.49, .95], [1.365, 1.333], [-1.69, 1.333]], [[-1.53, -1.14], [-1.53, 1.14], [1.51, -.95], [1.24, 1.12]]);
    usb(-1.61, -.59, .59, .45, .75, true);
    // Barrel jack: rectangular housing, recessed mouth, center contact.
    block("chip", [-1.62, .22, .73], [.64, .26, .44]);
    round("chip", [-1.67, .35, .73], [.22, .68, .22], [0, 0, Math.PI / 2]);
    add(ring, "chip", [-2.015, .35, .73], [.218, .218, 1], [0, -Math.PI / 2, 0]);
    round("metal", [-1.985, .35, .73], [.035, .12, .035], [0, 0, Math.PI / 2]);
    // DIP socket beneath the ATmega package, with two complete lead rows.
    block("substrate", [.47, .16, .3], [.81, .13, 1.64]);
    block("chip", [.47, .27, .3], [.58, .22, 1.5]);
    for (let i = 0; i < 14; i++) for (const side of [-1, 1]) {
      block("metal", [.47 + side * .35, .16, -.365 + i * .102], [.16, .035, .035]);
      block("metal", [.47 + side * .415, .115, -.365 + i * .102], [.035, .075, .035]);
    }
    round("substrate", [.47, .382, -.38], [.075, .006, .075]);
    for (let i = 0; i < 3; i++) block("silkscreen", [.47, .383, .1 + i * .07], [.29 - i * .04, .004, .014]);
    qfp(-.64, -.49, .37, 8);
    for (const [x, width, z] of [[.86, 1.1, -1.206], [-.17, .85, -1.206], [.96, .8, 1.206], [-.19, .44, 1.206], [-.66, .31, 1.206]]) block("chip", [x, .175, z], [width, .2, .19]);
    for (const [x, y, z] of unoHeaderPads) {
      // Four rim pieces leave an actual dark socket instead of a solid gold cube.
      for (const side of [-1, 1]) {
        block("metal", [x + side * .032, y, z], [.012, .009, .076]);
        block("metal", [x, y, z + side * .032], [.052, .009, .012]);
      }
      block("silkscreen", [x, .094, z * .86], [.043, .005, .015]);
    }
    for (const [x, z] of [[-.91, .63], [-.91, .94]]) {
      round("chip", [x, .235, z], [.108, .28, .108]);
      round("metal", [x, .38, z], [.097, .012, .097]);
      block("chip", [x, .388, z], [.11, .004, .009]);
    }
    block("metal", [-.35, .14, -.04], [.38, .1, .14]);
    block("chip", [-1.13, .16, .1], [.25, .13, .29]);
    for (const [x, z] of [[-1.16, -.92], [-.92, -.88], [-.27, -.83], [.06, -.83], [.35, -.82], [1.18, -.44], [1.18, -.12], [1.18, .42], [-.4, .72]]) smd(x, z);
    for (const z of [-.25, .08, .43]) smd(-.65, z, .15, .08, true);
    for (let i = 0; i < 6; i++) block("gold", [1.38 + (i % 2) * .1, .18, .46 + Math.floor(i / 2) * .1], [.04, .17, .04]);
    block("chip", [1.43, .115, .56], [.22, .065, .32]);
  } else {
    // Nano (45 x 18mm) and ESP32 DevKit (about 52 x 28mm).
    const nano = type === "nano", width = nano ? 1.18 : 1.75, length = nano ? 2.93 : 3.45, count = nano ? 15 : 19;
    const w = width / 2, l = length / 2, bevel = .075;
    outline([[-w + bevel, -l], [w - bevel, -l], [w, -l + bevel], [w, l - bevel], [w - bevel, l], [-w + bevel, l], [-w, l - bevel], [-w, -l + bevel]], nano ? [] : [[-.64, -1.53], [.64, -1.53], [-.64, 1.51], [.64, 1.51]]);
    for (const side of [-1, 1]) {
      block("chip", [side * (w - .08), -.08, 0], [.16, .14, length - .2]);
      for (let i = 0; i < count; i++) {
        const x = side * (w - .08), z = -l + .18 + i * (length - .36) / (count - 1);
        block("gold", [x, -.12, z], [.045, .44, .045]); pad([x, .096, z]);
        block("silkscreen", [x * .77, .094, z], [.042, .004, .013]);
      }
    }
    usb(0, l - .16, nano ? .46 : .48, nano ? .29 : .17, nano ? .48 : .34, false);
    if (nano) {
      qfp(0, -.12, .43, 8, Math.PI / 4);
      block("metal", [0, .15, -.78], [.29, .11, .15]);
      block("chip", [0, .21, .66], [.25, .16, .28]);
      for (let i = 0; i < 5; i++) for (const side of [-1, 1]) block("metal", [side * .16, .16, .55 + i * .053], [.09, .03, .022]);
      block("metal", [0, .13, 1.04], [.17, .08, .16]); block("chip", [0, .18, 1.04], [.09, .02, .08]);
      for (const [x, z] of [[-.29, -.61], [.29, -.62], [-.27, .39], [.29, .36], [0, -1.07], [.25, .92]]) smd(x, z, .1, .045, true);
      for (let i = 0; i < 6; i++) { pad([-.17 + (i % 2) * .34, .096, -1.23 + Math.floor(i / 2) * .1], .038); }
    } else {
      // RF daughterboard, shield lid/seam and exposed antenna keepout.
      block("substrate", [0, .115, -.62], [1.04, .055, 2]);
      block("substrate", [0, .15, -.43], [1.01, .035, 1.39]);
      block("metal", [0, .235, -.43], [.94, .16, 1.35]);
      block("metal", [0, .323, -.43], [.88, .025, 1.29]);
      for (let i = 0; i < 3; i++) block("substrate", [0, .338, -.64 + i * .065], [.45 - i * .08, .004, .013]);
      for (const side of [-1, 1]) for (let i = 0; i < 9; i++) block("gold", [side * .515, .147, -1.05 + i * .16], [.065, .018, .045]);
      // One connected meander, with horizontal links alternating sides.
      for (let i = 0; i < 5; i++) block("gold", [-.32 + i * .16, .147, -1.39], [.027, .012, .32]);
      for (let i = 0; i < 4; i++) block("gold", [-.24 + i * .16, .147, -1.39 + (i % 2 ? -.16 : .16)], [.187, .012, .027]);
      block("gold", [.32, .147, -1.17], [.027, .012, .12]);
      qfp(0, .69, .29, 6);
      for (const x of [-.48, .48]) { block("metal", [x, .15, 1.25], [.2, .13, .23]); block("chip", [x, .23, 1.25], [.1, .025, .13]); }
      for (const [x, z] of [[-.3, .42], [.33, .4], [-.3, .73], [.33, .78], [0, 1.06]]) smd(x, z, .12, .06, true);
    }
  }
  box.dispose(); cylinder.dispose(); ring.dispose();
  return [...buckets].map(([finish, parts]) => {
    const geometry = mergeGeometries(parts)!;
    parts.forEach((part) => part.dispose());
    geometry.computeBoundingBox(); geometry.computeBoundingSphere();
    return { finish, geometry };
  });
}
