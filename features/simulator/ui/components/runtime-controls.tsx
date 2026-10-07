"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useSimulation } from "../../stores/simulation-store";
import { setSimulationInput } from "../../worker/bridge";
import type { ComponentInstance } from "../../types/project";
export function RuntimeControls({ component }: { component: ComponentInstance }) {
  const running = useSimulation((s) => s.status === "running");
  const output = useSimulation((s) => s.outputs[component.id] ?? 0);
  const [values, setValues] = useState(component.properties);
  function input(property: string, value: number) { setValues((p) => ({ ...p, [property]: value })); setSimulationInput(component.id, property, value); }
  return <div className="nodrag nopan nowheel mt-3 space-y-2">
    {["led", "relay", "fan"].includes(component.type) && <output aria-label={`Output ${component.label}`} data-testid={`output-${component.id}`} data-value={output} className={`block rounded border px-2 py-1 text-xs ${output > 0 ? "bg-primary text-primary-foreground" : "text-text-secondary"}`}>{output > 0 ? `Aktif · ${Math.round(output * 100)}%` : "Mati"}</output>}
    {component.type === "button" && <Button className="w-full touch-none" disabled={!running} aria-label={`Tekan ${component.label}`} onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); input("pressed", 1); }} onPointerUp={() => input("pressed", 0)} onPointerCancel={() => input("pressed", 0)} onLostPointerCapture={() => input("pressed", 0)} onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); input("pressed", 1); } }} onKeyUp={(e) => { if (e.key === " " || e.key === "Enter") input("pressed", 0); }} onBlur={() => input("pressed", 0)}>Tekan</Button>}
    {(component.type === "pot" ? ["value"] : component.type === "dht22" ? ["temperature", "humidity"] : []).map((property) => <label key={property} className="block text-xs">{property === "value" ? "Posisi" : property === "temperature" ? "Suhu °C" : "Kelembapan %"}: {values[property]}<input disabled={!running} type="range" className="h-11 w-full accent-primary" min={property === "temperature" ? -40 : 0} max={property === "temperature" ? 80 : 100} value={values[property]} onChange={(e) => input(property, Number(e.target.value))} /></label>)}
  </div>;
}
