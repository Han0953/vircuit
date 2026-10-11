"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { Group, PerspectiveCamera } from "three";
import { featuredBoards, sampleCinematic, type CinematicChannel, type FeaturedBoard } from "../homepage-cinematic-config";
import { createHardwareResources, hardwareTokens, HardwareModel } from "./hardware-models";
import { CompactBoard } from "./board-models";

export type CinematicWorldProps = { channel: CinematicChannel; host: HTMLElement; ready: () => void; fail: () => void };
function Boards({ channel, host, ready, fail }: CinematicWorldProps) {
  const { camera, gl, invalidate, size, setDpr } = useThree();
  const resources = useMemo(() => createHardwareResources(), []);
  const groups = useRef<Partial<Record<FeaturedBoard, Group>>>({});
  const state = useRef({ requested: 0, slow: 0, low: false, frames: 0, announced: false, readyFrame: 0 });
  useEffect(() => {
    const apply = () => {
      if (document.hidden) return;
      state.current.announced = false;
      const pose = sampleCinematic(channel.read());
      for (const type of featuredBoards) {
        const group = groups.current[type];
        if (!group) continue;
        group.visible = type === pose.board;
        group.position.set(...pose.position);
        group.rotation.set(...pose.rotation);
        group.scale.setScalar(pose.scale);
      }
      camera.position.set(...pose.camera); camera.lookAt(...pose.target);
      if (camera instanceof PerspectiveCamera) { camera.fov = size.width / size.height < 1 ? 37 : 32; camera.updateProjectionMatrix(); }
      host.dataset.board = pose.board;
      host.dataset.worldProgress = pose.p.toFixed(3);
      host.dataset.camera = pose.camera.join(",");
      if (!state.current.requested) state.current.requested = performance.now();
      invalidate();
    };
    const palette = () => {
      const css = getComputedStyle(host);
      for (const name of Object.keys(hardwareTokens) as (keyof typeof hardwareTokens)[]) {
        const color = css.getPropertyValue(`--part-${hardwareTokens[name]}`).trim();
        if (color) resources.materials[name].color.set(color);
      }
      apply();
    };
    const theme = new MutationObserver(palette);
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    const lost = (event: Event) => { event.preventDefault(); fail(); };
    gl.domElement.addEventListener("webglcontextlost", lost);
    document.addEventListener("visibilitychange", apply);
    const off = channel.subscribe(apply);
    palette();
    const renderState = state.current;
    return () => { cancelAnimationFrame(renderState.readyFrame); renderState.readyFrame = 0; off(); theme.disconnect(); gl.domElement.removeEventListener("webglcontextlost", lost); document.removeEventListener("visibilitychange", apply); };
  }, [camera, channel, fail, gl, host, invalidate, resources, size]);
  useEffect(() => () => resources.dispose(), [resources]);
  useFrame(() => {
    const s = state.current;
    const latency = s.requested ? performance.now() - s.requested : 0;
    s.requested = 0;
    if (latency > 40) s.slow++; else if (latency > 0 && latency < 25) s.slow = Math.max(0, s.slow - 1);
    if (s.slow > 24) {
      if (s.low) { fail(); return; }
      s.low = true; s.slow = 0; setDpr(.75); host.setAttribute("data-quality", "low");
    }
    host.setAttribute("data-render-frames", String(++s.frames));
    // useFrame runs before gl.render. Read counters after the completed frame,
    // including the first demand-rendered frame when the scene then stays idle.
    if (!s.readyFrame) s.readyFrame = requestAnimationFrame(() => {
      s.readyFrame = 0;
      host.setAttribute("data-draw-calls", String(gl.info.render.calls));
      host.setAttribute("data-triangles", String(gl.info.render.triangles));
      if (!s.announced) { s.announced = true; ready(); }
    });
  });
  return <>
    <hemisphereLight args={["#ffffff", "#8090a0", 1.55]} />
    <directionalLight position={[-4, 7, 3]} intensity={2.8} />
    <directionalLight position={[4, 3, -5]} intensity={.8} />
    <HardwareModel type="uno" resources={resources} onGroup={(group) => { if (group) groups.current.uno = group; }} />
    {(["nano", "esp32"] as const).map((type) => <group key={type} ref={(group) => { if (group) groups.current[type] = group; }} dispose={null}><CompactBoard type={type} resources={resources} /></group>)}
  </>;
}
export default function CinematicWorld(props: CinematicWorldProps) {
  return <Canvas frameloop="demand" dpr={1} camera={{ position: [0, 6.5, 9], fov: 32, near: .1, far: 50 }} gl={{ alpha: true, antialias: true, powerPreference: "low-power" }} fallback={null} onCreated={({ gl }) => gl.setClearAlpha(0)}><Boards {...props} /></Canvas>;
}
