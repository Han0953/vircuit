import { assembled, type Vector } from "../story-config";

export const unoSize = { width: 3.38, length: 2.666 };
const pin = (x: number, y: number): Vector => [(x / 648 - .5) * unoSize.width, .28, (y / 504 - .5) * unoSize.length];
export const unoPins = { D2: pin(528, 24), D3: pin(504, 24), GND: pin(312, 480), "5V": pin(264, 480), A0: pin(456, 480) };
export const unoHeaderPads: Vector[] = [
  ...Array.from({ length: 14 }, (_, i) => pin(24 * (24 - i) + (i < 8 ? 0 : -12), 24)),
  ...Array.from({ length: 6 }, (_, i) => pin(24 * (19 + i), 480)),
  ...[264, 288, 312].map((x) => pin(x, 480)),
];
const worldPin = (id: keyof typeof unoPins): Vector => unoPins[id].map((n, i) => n + assembled.uno[i]) as Vector;
export const storyWireRoutes: Vector[][] = [
  [worldPin("D3"), [-.55, .36, -1.38], [-.2, .36, .15], [.63, .3, .15]],
  [[1.57, .3, .15], [1.9, .35, .15], [1.9, .35, -.72], [.62, .28, -.72]],
  [[.78, .28, -.72], [.78, .35, -1.8], [-.7, .35, -1.8], worldPin("GND")],
  [[1.4, .32, .85], [.8, .4, 1.8], [-.8, .4, 1.8], worldPin("D2")],
  [[2, .32, .85], [2.2, .35, 1.55], [-.9, .35, 1.55], worldPin("GND")],
  [[3, .3, .62], [3.3, .35, 1.8], [-.2, .35, 2], worldPin("A0")],
  [[2.8, .3, .62], [2.8, .35, 2.2], [-2.65, .35, 2.2], worldPin("5V")],
  [[3.2, .3, .62], [3.5, .35, 2.4], [-1.15, .35, 2.4], worldPin("GND")],
];
