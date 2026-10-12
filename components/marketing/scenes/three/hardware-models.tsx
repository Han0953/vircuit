import { useLayoutEffect, useRef } from "react";
import { BoxGeometry, CylinderGeometry, Group, InstancedMesh, Matrix4, MeshStandardMaterial, SphereGeometry } from "three";
import type { PrimaryType, Vector } from "../story-config";
import type { FeaturedBoard } from "../homepage-cinematic-config";
import { createBoardGeometry } from "./board-geometry";
import { createBoardLettering } from "./board-lettering";
import type { HardwareQuality } from "./quality-policy";

export const hardwareTokens = { pcb: "pcb", substrate: "pcb-dark", chip: "chip", metal: "metal", gold: "gold", silkscreen: "silkscreen", breadboard: "breadboard", resistor: "resistor", led: "led-on" } as const;

export function createHardwareResources(quality: HardwareQuality = "high") {
  const materials = {
    pcb: new MeshStandardMaterial({ color: "#1b7598", roughness: .74, metalness: .04 }),
    substrate: new MeshStandardMaterial({ color: "#244343", roughness: .88 }),
    chip: new MeshStandardMaterial({ color: "#25282b", roughness: .85 }),
    metal: new MeshStandardMaterial({ color: "#bdc6c9", metalness: .65, roughness: .43 }),
    gold: new MeshStandardMaterial({ color: "#d8b971", metalness: .48, roughness: .53 }),
    silkscreen: new MeshStandardMaterial({ color: "#f1f4ed", roughness: .9 }),
    breadboard: new MeshStandardMaterial({ color: "#e6e5df", roughness: .8 }),
    resistor: new MeshStandardMaterial({ color: "#dbc99d", roughness: .7 }),
    led: new MeshStandardMaterial({ color: "#ff5a51", emissive: "#ff5a51", emissiveIntensity: 0, roughness: .35 }),
  };
  const geometry = { box: new BoxGeometry(), cylinder: new CylinderGeometry(1, 1, 1, 12), dome: new SphereGeometry(1, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2) };
  const boards = { uno: createBoardGeometry("uno", quality), nano: createBoardGeometry("nano", quality), esp32: createBoardGeometry("esp32", quality) };
  const resolution = quality === "low" ? 512 : 1024;
  const lettering = { uno: createBoardLettering("uno", resolution), nano: createBoardLettering("nano", resolution), esp32: createBoardLettering("esp32", resolution) };
  return { materials, geometry, boards, lettering, dispose() { Object.values(materials).forEach((m) => m.dispose()); Object.values(geometry).forEach((g) => g.dispose()); Object.values(boards).flat().forEach(({ geometry: g }) => g.dispose()); Object.values(lettering).forEach((print) => print?.dispose()); } };
}
export type HardwareResources = ReturnType<typeof createHardwareResources>;
type MaterialName = keyof HardwareResources["materials"];
export function Pieces({ resources: r, positions, size, sizes, material = "metal" }: { resources: HardwareResources; positions: Vector[]; size: Vector; sizes?: Vector[]; material?: MaterialName }) {
  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const matrix = new Matrix4();
    positions.forEach(([x, y, z], i) => { matrix.makeScale(...(sizes?.[i] ?? size)); matrix.setPosition(x, y, z); ref.current?.setMatrixAt(i, matrix); });
    if (ref.current) { ref.current.instanceMatrix.needsUpdate = true; ref.current.computeBoundingSphere(); }
  }, [positions, size, sizes]);
  return <instancedMesh ref={ref} args={[r.geometry.box, r.materials[material], positions.length]} dispose={null} />;
}
export function Part({ r, position = [0, 0, 0], scale, material, cylinder = false, rotation = [0, 0, 0] }: { r: HardwareResources; position?: Vector; scale: Vector; material: MaterialName; cylinder?: boolean; rotation?: Vector }) {
  return <mesh geometry={cylinder ? r.geometry.cylinder : r.geometry.box} material={r.materials[material]} position={position} scale={scale} rotation={rotation} dispose={null} />;
}
export function BoardModel({ type, resources: r }: { type: FeaturedBoard; resources: HardwareResources }) {
  const print = r.lettering[type];
  return <group name={`board-${type}`} dispose={null}>{r.boards[type].map(({ finish, geometry }) => <mesh key={finish} name={`${type}-${finish}`} geometry={geometry} material={r.materials[finish]} dispose={null} />)}{print && <mesh name={`${type}-lettering`} geometry={print.geometry} material={print.material} dispose={null} />}</group>;
}
function Uno({ r }: { r: HardwareResources }) { return <BoardModel type="uno" resources={r} />; }
function Breadboard({ r }: { r: HardwareResources }) {
  const holes = Array.from({ length: 17 }, (_, row) => Array.from({ length: 10 }, (_, col): Vector => [-1 + col * .19 + (col >= 5 ? .2 : 0), .19, -1.3 + row * .16])).flat();
  return <>
    <Part r={r} scale={[2.4, .3, 3]} material="breadboard" />
    <Part r={r} position={[0, .155, 0]} scale={[.13, .018, 2.85]} material="chip" />
    <Pieces resources={r} positions={holes} size={[.055, .015, .055]} material="chip" />
  </>;
}
function Led({ r }: { r: HardwareResources }) {
  return <>
    <Pieces resources={r} positions={[[-.08, .17, 0], [.08, .17, 0]]} size={[.025, .35, .025]} />
    <Part r={r} position={[0, .43, 0]} scale={[.16, .25, .16]} material="led" cylinder />
    <mesh geometry={r.geometry.dome} material={r.materials.led} position={[0, .555, 0]} scale={[.16, .16, .16]} dispose={null} />
    <Part r={r} position={[0, .31, 0]} scale={[.19, .035, .19]} material="led" cylinder />
  </>;
}
function Resistor({ r }: { r: HardwareResources }) {
  return <>
    <Part r={r} scale={[.028, .95, .028]} rotation={[0, 0, Math.PI / 2]} material="metal" cylinder />
    <Part r={r} scale={[.105, .5, .105]} rotation={[0, 0, Math.PI / 2]} material="resistor" cylinder />
  </>;
}
function ButtonModel({ r }: { r: HardwareResources }) {
  return <>
    <Part r={r} scale={[.55, .17, .55]} material="chip" />
    <Part r={r} position={[0, .1, 0]} scale={[.5, .04, .5]} material="metal" />
    <group name="button-cap" position={[0, .22, 0]}><Part r={r} scale={[.16, .2, .16]} material="chip" cylinder /></group>
    <Pieces resources={r} positions={[[-.3, -.02, 0], [.3, -.02, 0]]} size={[.13, .05, .07]} />
  </>;
}
function Pot({ r }: { r: HardwareResources }) {
  return <>
    <Part r={r} scale={[.34, .2, .34]} material="metal" cylinder />
    <Part r={r} position={[0, .23, 0]} scale={[.09, .35, .09]} material="metal" cylinder />
    <group name="pot-knob" position={[0, .4, 0]}><Part r={r} scale={[.26, .28, .26]} material="chip" cylinder /><Part r={r} position={[0, .145, -.12]} scale={[.025, .01, .15]} material="breadboard" /></group>
    <Pieces resources={r} positions={[-.2, 0, .2].map((x): Vector => [x, -.05, .42])} size={[.04, .04, .4]} />
  </>;
}
const models = { uno: Uno, "breadboard-mini": Breadboard, led: Led, resistor: Resistor, button: ButtonModel, pot: Pot };
export function HardwareModel({ type, resources, onGroup }: { type: PrimaryType; resources: HardwareResources; onGroup: (group: Group | null) => void }) {
  const Model = models[type];
  return <group ref={onGroup} name={type} dispose={null}><Model r={resources} /></group>;
}
