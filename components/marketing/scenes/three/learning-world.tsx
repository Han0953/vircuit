"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useHardwareQuality } from "./use-hardware-quality";
import { framedFov } from "./quality-policy";
import { useEffect, useMemo, useRef } from "react";
import { BufferGeometry, CatmullRomCurve3, Group, MeshBasicMaterial, PerspectiveCamera, TubeGeometry, Vector3 } from "three";
import { primaryTypes } from "../component-motion-registry";
import { sampleStory, type PrimaryType, type StoryChannel } from "../story-config";
import { createHardwareResources, hardwareTokens, HardwareModel } from "./hardware-models";
import { storyWireRoutes } from "./hardware-layout";

function World({ channel, host, ready, fail }: { channel: StoryChannel; host: HTMLElement; ready: () => void; fail: () => void }) {
  const { camera, gl, invalidate, size } = useThree();
  const groups = useRef<Partial<Record<PrimaryType, Group>>>({});
  const { quality, report } = useHardwareQuality(host, fail);
  const resources = useMemo(() => createHardwareResources(quality), [quality]);
  const wires = useMemo(() => storyWireRoutes.map((route) => new TubeGeometry(new CatmullRomCurve3(route.map((point) => new Vector3(...point)), false, "centripetal"), 32, .017, 4, false)), []);
  const wireMaterial = useMemo(() => new MeshBasicMaterial({ color: "#2563eb" }), []);
  const renderState = useRef({ visible: false, requested: 0, frames: 0, readyFrame: 0 });
  useEffect(() => {
    let active = true;
    const state = renderState.current;
    let colors = { wire: "#2563eb", diagnostic: "#ef4444", on: "#ff5a51", off: "#752c31" };
    const palette = () => {
      const css = getComputedStyle(host);
      const color = (token: string, fallback: string) => css.getPropertyValue(token).trim() || fallback;
      colors = { wire: color("--primary", colors.wire), diagnostic: color("--destructive", colors.diagnostic), on: color("--part-led-on", colors.on), off: color("--part-led-off", colors.off) };
      for (const [name, material] of Object.entries(resources.materials)) {
        const token = hardwareTokens[name as keyof typeof resources.materials];
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
      if (camera instanceof PerspectiveCamera) setFieldOfView(camera, framedFov(size.width < 600 ? 31 : 38, size.width / size.height, size.width < 600 ? 1.5 : .85));
      camera.position.set(...pose.camera); camera.lookAt(...pose.target); camera.updateProjectionMatrix();
      host.setAttribute("data-world-progress", pose.p.toFixed(3)); host.setAttribute("data-camera", pose.camera.join(","));
      if (!state.requested) state.requested = performance.now();
      invalidate();
    };
    const observer = new IntersectionObserver(([entry]) => { state.visible = entry.isIntersecting; state.requested = 0; apply(); }); observer.observe(host);
    const theme = new MutationObserver(() => { palette(); apply(); });
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme-changing"] });
    const lost = (event: Event) => { event.preventDefault(); fail(); };
    gl.domElement.addEventListener("webglcontextlost", lost);
    const visibility = () => apply();
    document.addEventListener("visibilitychange", visibility);
    const off = channel.subscribe(() => apply()); palette(); apply(true);
    return () => { active = false; cancelAnimationFrame(state.readyFrame); state.readyFrame = 0; off(); observer.disconnect(); theme.disconnect(); document.removeEventListener("visibilitychange", visibility); gl.domElement.removeEventListener("webglcontextlost", lost); };
  }, [camera, channel, fail, gl, host, invalidate, resources, size.width, size.height, wireMaterial, wires]);
  useEffect(() => () => { resources.dispose(); wireMaterial.dispose(); wires.forEach((wire: BufferGeometry) => wire.dispose()); }, [resources, wireMaterial, wires]);
  useFrame(() => {
    const state = renderState.current; const delta = state.requested ? performance.now() - state.requested : 0; state.requested = 0;
    if (!report(delta)) return;
    state.frames++; host.setAttribute("data-render-frames", String(state.frames));
    // Counters belong to the completed render, not the preceding idle frame.
    if (!state.readyFrame) state.readyFrame = requestAnimationFrame(() => {
      state.readyFrame = 0;
      host.setAttribute("data-draw-calls", String(gl.info.render.calls)); host.setAttribute("data-triangles", String(gl.info.render.triangles));
      // A cached route can resume after the presentation channel was reset.
      if (!channel.read().webgl) ready();
    });
  });
  return <>
    <hemisphereLight args={["#ffffff", "#8090a0", 1.55]} />
    <directionalLight position={[-4, 7, 3]} intensity={2.8} />
    {quality !== "low" && <directionalLight position={[4, 3, -5]} intensity={.8} />}
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
