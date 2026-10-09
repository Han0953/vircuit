"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { BufferGeometry, CatmullRomCurve3, Group, MeshBasicMaterial, PerspectiveCamera, TubeGeometry, Vector3 } from "three";
import { primaryTypes } from "../component-motion-registry";
import { sampleStory, type PrimaryType, type StoryChannel } from "../story-config";
import { createHardwareResources, HardwareModel } from "./hardware-models";

const routes = [
  [[-1.15, .28, -1.38], [-.55, .36, -1.38], [-.2, .36, .15], [.63, .3, .15]],
  [[1.57, .3, .15], [1.9, .35, .15], [1.9, .35, -.72], [.62, .28, -.72]],
  [[.78, .28, -.72], [.78, .35, -1.8], [-.7, .35, -1.8], [-1.15, .28, 1.38]],
  [[1.4, .32, .85], [.8, .4, 1.8], [-.8, .4, 1.8], [-1.35, .28, -1.38]],
  [[2, .32, .85], [2.2, .35, 1.55], [-.9, .35, 1.55], [-1.15, .28, 1.38]],
  [[3, .3, .62], [3.3, .35, 1.8], [-.2, .35, 2], [-1.8, .28, 1.38]],
  [[2.8, .3, .62], [2.8, .35, 2.2], [-2.65, .35, 2.2], [-2.65, .28, 1.38]],
  [[3.2, .3, .62], [3.5, .35, 2.4], [-1.15, .35, 2.4], [-1.15, .28, 1.38]],
];
function World({ channel, host, ready, fail }: { channel: StoryChannel; host: HTMLElement; ready: () => void; fail: () => void }) {
  const { camera, gl, invalidate, size, setDpr } = useThree();
  const groups = useRef<Partial<Record<PrimaryType, Group>>>({});
  const first = useRef(true);
  const resources = useMemo(() => createHardwareResources(), []);
  const wires = useMemo(() => routes.map((route) => new TubeGeometry(new CatmullRomCurve3(route.map((point) => new Vector3(...point)), false, "centripetal"), 32, .017, 4, false)), []);
  const wireMaterial = useMemo(() => new MeshBasicMaterial({ color: "#2563eb" }), []);
  const renderState = useRef({ visible: false, requested: 0, slow: 0, downgraded: false, frames: 0 });
  useEffect(() => {
    let active = true;
    const state = renderState.current;
    let colors = { wire: "#2563eb", diagnostic: "#ef4444", on: "#ff5a51", off: "#752c31" };
    const palette = () => {
      const css = getComputedStyle(host);
      const color = (token: string, fallback: string) => css.getPropertyValue(token).trim() || fallback;
      colors = { wire: color("--primary", colors.wire), diagnostic: color("--destructive", colors.diagnostic), on: color("--part-led-on", colors.on), off: color("--part-led-off", colors.off) };
      for (const [name, material] of Object.entries(resources.materials)) {
        const token = ({ pcb: "pcb", chip: "chip", metal: "metal", gold: "gold", breadboard: "breadboard", resistor: "resistor", led: "led-on" } as const)[name as keyof typeof resources.materials];
        material.color.set(color(`--part-${token}`, `#${material.color.getHexString()}`));
      }
      resources.materials.led.emissive.set(colors.on);
    };
    const apply = (initial = false) => {
      if (!active || (!initial && !state.visible) || document.hidden) return;
      const pose = sampleStory(channel.read().progress, size.width < 600);
      for (const type of primaryTypes) {
        const group = groups.current[type]; if (!group) continue;
        group.position.set(...pose.objects[type].position); group.rotation.set(...pose.objects[type].rotation); group.scale.setScalar(pose.objects[type].scale);
      }
      const cap = groups.current.button?.getObjectByName("button-cap"); if (cap) cap.position.y = .22 - pose.press * .09;
      const knob = groups.current.pot?.getObjectByName("pot-knob"); if (knob) knob.rotation.y = pose.knob;
      setLedIntensity(resources.materials.led, pose.led * .7);
      resources.materials.led.color.set(pose.led > .1 ? colors.on : colors.off);
      wires.forEach((geometry) => geometry.setDrawRange(0, Math.floor((geometry.index?.count ?? 0) * pose.wire / 3) * 3));
      wireMaterial.color.set(pose.diagnostic ? colors.diagnostic : colors.wire);
      if (camera instanceof PerspectiveCamera) setFieldOfView(camera, size.width < 600 ? 31 : 35);
      camera.position.set(...pose.camera); camera.lookAt(...pose.target); camera.updateProjectionMatrix();
      host.setAttribute("data-world-progress", pose.p.toFixed(3)); host.setAttribute("data-camera", pose.camera.join(","));
      if (!state.requested) state.requested = performance.now();
      invalidate();
    };
    const observer = new IntersectionObserver(([entry]) => { state.visible = entry.isIntersecting; state.requested = 0; apply(); }); observer.observe(host);
    const theme = new MutationObserver(() => { palette(); apply(); });
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    const lost = (event: Event) => { event.preventDefault(); fail(); };
    gl.domElement.addEventListener("webglcontextlost", lost);
    const visibility = () => apply();
    document.addEventListener("visibilitychange", visibility);
    const off = channel.subscribe(() => apply()); palette(); apply(true);
    return () => { active = false; off(); observer.disconnect(); theme.disconnect(); document.removeEventListener("visibilitychange", visibility); gl.domElement.removeEventListener("webglcontextlost", lost); };
  }, [camera, channel, fail, gl, host, invalidate, resources, size.width, wireMaterial, wires]);
  useEffect(() => () => { resources.dispose(); wireMaterial.dispose(); wires.forEach((wire: BufferGeometry) => wire.dispose()); }, [resources, wireMaterial, wires]);
  useFrame(() => {
    const state = renderState.current; const delta = state.requested ? performance.now() - state.requested : 0; state.requested = 0;
    // Measure requested-frame latency, excluding demand-rendered idle intervals.
    if (delta > 40) state.slow++; else if (delta > 0 && delta < 25) state.slow = Math.max(0, state.slow - 1);
    if (state.slow > 24) {
      if (!state.downgraded) { state.downgraded = true; state.slow = 0; setDpr(.75); host.setAttribute("data-quality", "low"); }
      else { fail(); return; }
    }
    state.frames++; host.setAttribute("data-render-frames", String(state.frames));
    host.setAttribute("data-draw-calls", String(gl.info.render.calls)); host.setAttribute("data-triangles", String(gl.info.render.triangles));
    if (first.current) { first.current = false; requestAnimationFrame(ready); }
  });
  return <>
    <hemisphereLight args={["#ffffff", "#8090a0", 2]} /><directionalLight position={[-3, 8, 5]} intensity={2.5} />
    {primaryTypes.map((type) => <HardwareModel key={type} type={type} resources={resources} onGroup={(group) => { if (group) groups.current[type] = group; }} />)}
    {wires.map((geometry, i) => <mesh key={i} geometry={geometry} material={wireMaterial} dispose={null} />)}
  </>;
}
export default function LearningWorld(props: { channel: StoryChannel; host: HTMLElement; ready: () => void; fail: () => void }) {
  return <Canvas frameloop="demand" dpr={1} camera={{ position: [.6, 8.5, 10.8], fov: 31, near: .1, far: 50 }} gl={{ alpha: true, antialias: true, powerPreference: "low-power" }} fallback={null} onCreated={({ gl }) => { gl.setClearAlpha(0); }}>
    <World {...props} />
  </Canvas>;
}
function setLedIntensity(material: { emissiveIntensity: number }, value: number) { material.emissiveIntensity = value; }
function setFieldOfView(camera: PerspectiveCamera, value: number) { camera.fov = value; }
