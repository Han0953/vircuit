import { Part, Pieces, type HardwareResources } from "./hardware-models";
import type { Vector } from "../story-config";

/** Marketing geometry only. Logical pins and simulator dimensions are not changed. */
export function CompactBoard({ type, resources: r }: { type: "nano" | "esp32"; resources: HardwareResources }) {
  const nano = type === "nano";
  const width = nano ? 1.18 : 1.75;
  const length = nano ? 2.93 : 3.45;
  const count = nano ? 15 : 19;
  const pins: Vector[] = [-1, 1].flatMap((side) => Array.from({ length: count }, (_, i): Vector => [side * (width / 2 - .08), -.11, -length / 2 + .18 + i * (length - .36) / (count - 1)]));
  const pads: Vector[] = pins.map(([x, , z]) => [x, .065, z]);
  const markings: Vector[] = pins.map(([x, , z]) => [x * .78, .052, z]);
  return <>
    <Part r={r} scale={[width, .1, length]} material={nano ? "pcb" : "chip"} />
    <Pieces resources={r} positions={pins} size={[.055, .38, .055]} material="gold" />
    <Pieces resources={r} positions={pads} size={[.105, .025, .105]} material="gold" />
    <Pieces resources={r} positions={markings} size={[.055, .01, .023]} material="breadboard" />
    <Pieces resources={r} positions={[-1, 1].flatMap((side) => Array.from({ length: nano ? 8 : 10 }, (_, i): Vector => [side * (width / 2 - .25), .059, -.95 + i * .2]))} size={[.018, .01, .14]} material="gold" />
    <Part r={r} position={[0, .19, length / 2 - .17]} scale={[nano ? .45 : .48, .27, .48]} material="metal" />
    <Part r={r} position={[0, .19, length / 2 + .075]} scale={[nano ? .31 : .35, .12, .018]} material="chip" />
    {nano ? <>
      <Part r={r} position={[0, .13, -.08]} scale={[.47, .15, .47]} rotation={[0, Math.PI / 4, 0]} material="chip" />
      <Pieces resources={r} positions={[-1, 1].flatMap((side) => Array.from({ length: 8 }, (_, i): Vector => [side * .34, .12, -.36 + i * .08]))} size={[.09, .03, .035]} />
      <Part r={r} position={[0, .09, -.8]} scale={[.28, .08, .21]} material="metal" />
      <Part r={r} position={[0, .15, .65]} scale={[.27, .16, .25]} material="chip" />
      <Part r={r} position={[0, .13, 1.04]} scale={[.17, .1, .16]} material="metal" />
      <Part r={r} position={[0, .19, 1.04]} scale={[.09, .025, .08]} material="chip" />
    </> : <>
      <Part r={r} position={[0, .16, -.43]} scale={[.94, .22, 1.35]} material="metal" />
      <Part r={r} position={[0, .275, -.43]} scale={[.84, .012, 1.22]} material="breadboard" />
      <Pieces resources={r} positions={[-.28, -.14, 0, .14, .28].map((x): Vector => [x, .285, -.48])} size={[.055, .006, .35]} material="metal" />
      <Pieces resources={r} positions={[-1, 1].flatMap((side) => Array.from({ length: 8 }, (_, i): Vector => [side * .51, .095, -.98 + i * .16]))} size={[.07, .025, .045]} material="gold" />
      <Part r={r} position={[0, .057, -1.35]} scale={[.93, .014, .42]} material="pcb" />
      <Pieces resources={r} positions={Array.from({ length: 5 }, (_, i): Vector => [-.32 + i * .16, .074, -1.35])} size={[.027, .014, .3]} material="gold" />
      <Part r={r} position={[-.5, .13, 1.25]} scale={[.2, .15, .23]} material="metal" />
      <Part r={r} position={[.5, .13, 1.25]} scale={[.2, .15, .23]} material="metal" />
      <Pieces resources={r} positions={[-.5, .5].map((x): Vector => [x, .215, 1.25])} size={[.1, .025, .13]} material="chip" />
      <Part r={r} position={[0, .12, .66]} scale={[.34, .13, .37]} material="chip" />
    </>}
    <Pieces resources={r} positions={[-.25, .25].flatMap((x) => [.4, -.4, -.65].map((z): Vector => [x, .09, z]))} size={[.1, .08, .15]} material="metal" />
    <Part r={r} position={[.22, .11, nano ? 1.04 : .96]} scale={[.065, .065, .1]} material="led" />
  </>;
}
