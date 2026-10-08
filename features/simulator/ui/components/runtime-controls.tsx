"use client";
import { useSimulation } from "../../stores/simulation-store";
import { setSimulationInput } from "../../worker/bridge";
import type { ComponentInstance } from "../../types/project";
import type { VisualLayout } from "../visuals/pin-layout";

export function RuntimeControls({ component, layout }: { component: ComponentInstance; layout?: VisualLayout }) {
  const running = useSimulation((s) => s.status === "running");
  const output = useSimulation((s) => s.outputs[component.id] ?? 0);
  const values = useSimulation((s) => s.inputs[component.id]);
  const input = (property: string, value: number) => setSimulationInput(component.id, property, value);
  if (layout) return <>
    {["led", "relay", "fan"].includes(component.type) && <output aria-label={`Output ${component.label}`} data-testid={`output-${component.id}`} data-value={output} className="sr-only">{output > 0 ? `Aktif · ${Math.round(output * 100)}%` : "Mati"}</output>}
    {component.type === "button" && layout.interaction && <button type="button" className="runtime-hit nodrag nopan pointer-events-auto absolute touch-none rounded-full" style={{ left: layout.interaction.x, top: layout.interaction.y, width: layout.interaction.width, height: layout.interaction.height }} disabled={!running} aria-label={`Tekan ${component.label}`} aria-pressed={!!values?.pressed}
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); input("pressed", 1); }} onPointerUp={() => input("pressed", 0)} onPointerCancel={() => input("pressed", 0)} onLostPointerCapture={() => input("pressed", 0)}
      onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); input("pressed", 1); } }} onKeyUp={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); input("pressed", 0); } }} onBlur={() => input("pressed", 0)} />}
    {component.type === "pot" && layout.interaction && <input type="range" className="runtime-hit nodrag nopan nowheel pointer-events-auto absolute opacity-0" style={{ left: layout.interaction.x, top: layout.interaction.y, width: layout.interaction.width, height: layout.interaction.height }} aria-label={`Posisi ${component.label}`} title="Geser knob atau gunakan tombol panah" disabled={!running} min={0} max={100} value={values?.value ?? component.properties.value} onChange={(e) => input("value", Number(e.target.value))} />}
  </>;
  return <div className="space-y-2">
    {component.type === "pot" || component.type === "dht22" ? <p className="text-xs text-text-secondary">Input simulasi · aktif saat Run</p> : null}
    {(component.type === "pot" ? ["value"] : component.type === "dht22" ? ["temperature", "humidity"] : []).map((property) => <label key={property} className="block text-xs">{property === "value" ? "Posisi" : property === "temperature" ? "Suhu °C" : "Kelembapan %"}: {values?.[property] ?? component.properties[property]}
      <input disabled={!running} type="range" className="h-11 w-full accent-primary" min={property === "temperature" ? -40 : 0} max={property === "temperature" ? 80 : 100} value={values?.[property] ?? component.properties[property]} onChange={(e) => input(property, Number(e.target.value))} />
    </label>)}
  </div>;
}
