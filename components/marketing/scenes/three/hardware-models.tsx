import { useLayoutEffect, useRef } from "react";
import { BoxGeometry, CylinderGeometry, ExtrudeGeometry, Group, InstancedMesh, Matrix4, MeshStandardMaterial, Shape, SphereGeometry } from "three";
import type { PrimaryType, Vector } from "../story-config";

export function createHardwareResources() {
  const shape = new Shape(); shape.moveTo(-1.3, -1.55); shape.lineTo(1.05, -1.55); shape.lineTo(1.3, -1.3); shape.lineTo(1.3, 1.25); shape.lineTo(1.05, 1.55); shape.lineTo(-1.3, 1.55); shape.closePath();
  const board = new ExtrudeGeometry(shape, { depth: .08, bevelEnabled: false }); board.rotateX(-Math.PI / 2);
  const materials = {
    pcb: new MeshStandardMaterial({ color: "#1b7598", roughness: .7 }),
    chip: new MeshStandardMaterial({ color: "#25282b", roughness: .85 }),
    metal: new MeshStandardMaterial({ color: "#bdc6c9", metalness: .5, roughness: .45 }),
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
function Pieces({ resources: r, positions, size, material = "metal" }: { resources: HardwareResources; positions: Vector[]; size: Vector; material?: MaterialName }) {
  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const matrix = new Matrix4();
    positions.forEach(([x, y, z], i) => { matrix.makeScale(...size); matrix.setPosition(x, y, z); ref.current?.setMatrixAt(i, matrix); });
    if (ref.current) { ref.current.instanceMatrix.needsUpdate = true; ref.current.computeBoundingSphere(); }
  }, [positions, size]);
  return <instancedMesh ref={ref} args={[r.geometry.box, r.materials[material], positions.length]} dispose={null} />;
}
function Part({ r, position = [0, 0, 0], scale, material, cylinder = false, rotation = [0, 0, 0] }: { r: HardwareResources; position?: Vector; scale: Vector; material: MaterialName; cylinder?: boolean; rotation?: Vector }) {
  return <mesh geometry={cylinder ? r.geometry.cylinder : r.geometry.box} material={r.materials[material]} position={position} scale={scale} rotation={rotation} dispose={null} />;
}
function Uno({ r }: { r: HardwareResources }) {
  return <>
    <mesh geometry={r.geometry.board} material={r.materials.pcb} dispose={null} />
    <Part r={r} position={[.35, .2, .35]} scale={[.55, .25, 1.35]} material="chip" />
    <Part r={r} position={[-1.2, .25, -.7]} scale={[.6, .4, .65]} material="metal" />
    <Part r={r} position={[-1.3, .28, .85]} scale={[.6, .4, .55]} material="chip" />
    <Part r={r} position={[-.35, .16, -.55]} scale={[.45, .2, .45]} material="chip" />
    <Pieces resources={r} positions={[-1.38, 1.38].map((z) => [0, .16, z] as Vector)} size={[2.15, .2, .19]} material="chip" />
    <Pieces resources={r} positions={[-1.38, 1.38].flatMap((z) => Array.from({ length: 12 }, (_, i): Vector => [-1 + i * .18, .27, z]))} size={[.07, .025, .07]} material="gold" />
    <Pieces resources={r} positions={[-.1, .8].flatMap((x) => Array.from({ length: 7 }, (_, i): Vector => [x, .18, -.2 + i * .18]))} size={[.12, .06, .06]} />
    <Pieces resources={r} positions={[[-.6, .25, .75], [-.6, .25, 1.05]]} size={[.23, .3, .23]} />
  </>;
}
function Breadboard({ r }: { r: HardwareResources }) {
  const holes = Array.from({ length: 17 }, (_, row) => Array.from({ length: 10 }, (_, col): Vector => [-1 + col * .19 + (col >= 5 ? .2 : 0), .19, -1.3 + row * .16])).flat();
  return <>
    <Part r={r} scale={[2.4, .3, 3]} material="breadboard" />
    <Part r={r} position={[0, .155, 0]} scale={[.13, .018, 2.85]} material="metal" />
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
