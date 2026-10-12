import { CanvasTexture, MeshBasicMaterial, PlaneGeometry, SRGBColorSpace } from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type { FeaturedBoard } from "../homepage-cinematic-config";
import { unoPins } from "./hardware-layout";

type Print = { text: string; x: number; z: number; size: number; dark?: boolean };
type PrintSurface = { width: number; length: number; x: number; z: number; y: number; labels: Print[] };

/** Stable, authored markings. One atlas and one draw call per visible board;
 * lettering follows the PCB / package surfaces rather than floating in screen space.
 */
export function boardPrintSurfaces(type: FeaturedBoard): PrintSurface[] {
  if (type === "uno") return [
    { width: 3.38, length: 2.666, x: 0, z: 0, y: .098, labels: [
      { text: "UNO R3", x: .98, z: -.75, size: .18 },
      { text: "ARDUINO", x: -.42, z: .9, size: .115 },
      { text: "DIGITAL / PWM", x: .32, z: -.9, size: .07 },
      { text: "POWER", x: -.6, z: 1.02, size: .065 },
      ...Object.entries(unoPins).map(([text, [x, , z]]) => ({ text, x, z: z * .86, size: .055 })),
      { text: "RESET", x: -1.13, z: .33, size: .06 },
    ] },
    { width: .56, length: 1.3, x: .47, z: .35, y: .387, labels: [
      { text: "ATMEGA", x: .47, z: .25, size: .085 },
      { text: "328P", x: .47, z: .4, size: .085 },
    ] },
  ];
  if (type === "nano") return [
    { width: 1.18, length: 2.93, x: 0, z: 0, y: .098, labels: [
      { text: "NANO", x: 0, z: -.61, size: .105 },
      { text: "ARDUINO", x: 0, z: -1.02, size: .085 },
      { text: "RESET", x: 0, z: .88, size: .055 },
      { text: "USB", x: .3, z: 1.16, size: .06 },
    ] },
    { width: .3, length: .25, x: 0, z: -.12, y: .267, labels: [
      { text: "ATMEGA", x: 0, z: -.15, size: .045 },
      { text: "328P", x: 0, z: -.07, size: .045 },
    ] },
  ];
  return [
    { width: 1.75, length: 3.45, x: 0, z: 0, y: .098, labels: [
      { text: "ESP32 DEVKIT", x: 0, z: .43, size: .1 },
      { text: "EN", x: -.48, z: 1.04, size: .065 },
      { text: "BOOT", x: .48, z: 1.04, size: .065 },
      { text: "USB", x: 0, z: 1.23, size: .06 },
    ] },
    { width: .86, length: 1.25, x: 0, z: -.43, y: .339, labels: [
      { text: "ESP32", x: 0, z: -.58, size: .17, dark: true },
      { text: "WROOM-32", x: 0, z: -.36, size: .085, dark: true },
      { text: "RF MODULE", x: 0, z: -.1, size: .065, dark: true },
    ] },
  ];
}

export function createBoardLettering(type: FeaturedBoard) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024; canvas.height = 1024;
  const context = canvas.getContext("2d");
  if (!context) return null;
  const surfaces = boardPrintSurfaces(type);
  const planes = surfaces.map((surface, index) => {
    const { width, length, x, z, y, labels } = surface;
    const top = index * 512;
    context.save(); context.beginPath(); context.rect(0, top, 1024, 512); context.clip();
    context.translate(0, top); context.scale(1024 / width, 512 / length);
    context.textAlign = "center"; context.textBaseline = "middle";
    for (const label of labels) {
      context.fillStyle = label.dark ? "#25282b" : "#f1f4ed";
      context.font = `600 ${label.size}px monospace`;
      context.fillText(label.text, label.x - x + width / 2, label.z - z + length / 2);
    }
    context.restore();
    const plane = new PlaneGeometry(width, length);
    const uv = plane.getAttribute("uv");
    for (let i = 0; i < uv.count; i++) uv.setY(i, uv.getY(i) * .5 + (index === 0 ? .5 : 0));
    plane.rotateX(-Math.PI / 2); plane.translate(x, y, z);
    return plane;
  });
  const geometry = mergeGeometries(planes)!;
  planes.forEach((plane) => plane.dispose());
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  const material = new MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  return { geometry, material, dispose() { geometry.dispose(); material.dispose(); texture.dispose(); } };
}
