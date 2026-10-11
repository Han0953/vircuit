import { useLayoutEffect, useRef } from "react";
import { BoxGeometry, CylinderGeometry, ExtrudeGeometry, Group, InstancedMesh, Matrix4, MeshStandardMaterial, Shape, SphereGeometry } from "three";
import type { PrimaryType, Vector } from "../story-config";
import { unoHeaderPads } from "./hardware-layout";

export function createHardwareResources() {
  const shape = new Shape(); shape.moveTo(-1.69, -1.333); shape.lineTo(1.365, -1.333); shape.lineTo(1.69, -1.118); shape.lineTo(1.69, 1.075); shape.lineTo(1.365, 1.333); shape.lineTo(-1.69, 1.333); shape.closePath();
  const board = new ExtrudeGeometry(shape, { depth: .08, bevelEnabled: false }); board.rotateX(-Math.PI / 2);
  const materials = {
    pcb: new MeshStandardMaterial({ color: "#1b7598", roughness: .7 }),
    chip: new MeshStandardMaterial({ color: "#25282b", roughness: .85 }),
    metal: new MeshStandardMaterial({ color: "#bdc6c9", metalness: .65, roughness: .32 }),
    gold: new MeshStandardMaterial({ color: "#d8b971", metalness: .5, roughness: .4 }),
    breadboard: new MeshStandardMaterial({ color: "#e6e5df", roughness: .8 }),
    resistor: new MeshStandardMaterial({ color: "#dbc99d", roughness: .7 }),
    led: new MeshStandardMaterial({ color: "#ff5a51", emissive: "#ff5a51", emissiveIntensity: 0, roughness: .35 }),
  };
  const geometry = { box: new BoxGeometry(), cylinder: new CylinderGeometry(1, 1, 1, 12), dome: new SphereGeometry(1, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), board };
  return { materials, geometry, dispose() { Object.values(materials).forEach((m) => m.dispose()); Object.values(geometry).forEach((g) => g.dispose()); } };
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
function Uno({ r }: { r: HardwareResources }) {
  return <>
    <mesh geometry={r.geometry.board} material={r.materials.pcb} dispose={null} />
    <Part r={r} position={[.45, .2, .3]} scale={[.72, .25, 1.16]} material="chip" />
    <Part r={r} position={[-1.56, .25, -.6]} scale={[.78, .4, .56]} material="metal" />
    <Part r={r} position={[-1.955, .25, -.6]} scale={[.018, .22, .38]} material="chip" />
    <Part r={r} position={[-1.68, .28, .73]} scale={[.23, .66, .23]} rotation={[0, 0, Math.PI / 2]} material="chip" cylinder />
    <Part r={r} position={[-2.015, .28, .73]} scale={[.16, .014, .16]} rotation={[0, 0, Math.PI / 2]} material="metal" cylinder />
    <Part r={r} position={[-.46, .16, -.47]} scale={[.58, .2, .39]} material="chip" />
    <Part r={r} position={[-.49, .115, .24]} scale={[.46, .07, .14]} material="metal" />
    <Part r={r} position={[-1.04, .12, -.9]} scale={[.31, .12, .17]} material="metal" />
    <Part r={r} position={[-1.04, .19, -.9]} scale={[.16, .02, .09]} material="chip" />
    <Pieces resources={r} positions={[-.12, 1.03].flatMap((x) => Array.from({ length: 14 }, (_, i): Vector => [x, .14, -.224 + i * .077]))} size={[.16, .04, .03]} />
    <Pieces resources={r} positions={[-.98, -.65, .26, .59, .91].map((x): Vector => [x, .09, -.99])} size={[.16, .025, .025]} material="breadboard" />
    <Pieces resources={r} positions={[-1.04, -.39, .39, 1.04].flatMap((x) => [-.82, .82].map((z): Vector => [x, .085, z]))} size={[.018, .008, .33]} material="gold" />
    <Part r={r} position={[-.17, .11, .79]} scale={[.1, .05, .09]} material="led" />
    <Pieces resources={r} positions={[[.86, .16, -1.206], [-.17, .16, -1.206], [.96, .16, 1.206], [-.19, .16, 1.206]]} size={[1, .2, .19]} sizes={[1.1, .85, .8, .44].map((width): Vector => [width, .2, .19])} material="chip" />
    <Pieces resources={r} positions={unoHeaderPads} size={[.07, .025, .07]} material="gold" />
    <Pieces resources={r} positions={[[-.78, .25, .65], [-.78, .25, .9]]} size={[.15, .3, .15]} material="metal" />
  </>;
}
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
