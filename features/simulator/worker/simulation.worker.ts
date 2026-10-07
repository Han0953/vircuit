import { SimulationEngine } from "../runtime/engine";
import { CodeError } from "../runtime/language";
import type { WorkerRequest, WorkerResponse } from "./protocol";
let engine: SimulationEngine | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
const send = (message: WorkerResponse) => postMessage(message);
function fail(error: unknown) { clearTimeout(timer); engine = null; send({ type: "ERROR", problem: { id: "runtime", severity: "error", source: error instanceof CodeError ? "code" : "runtime", message: error instanceof Error ? error.message : "Simulasi gagal.", line: error instanceof CodeError ? error.line : undefined } }); }
function tick() {
  if (!engine) return;
  try { const state = engine.step(); send({ type: "STATE", ...state }); timer = setTimeout(tick, Math.max(16, state.delay)); }
  catch (error) { fail(error); }
}
self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  try {
    if (event.data.type === "RUN") { clearTimeout(timer); engine = new SimulationEngine(event.data.project); tick(); }
    else if (event.data.type === "CLEAR_SERIAL" && engine) engine.serial = "";
    else if (event.data.type === "INPUT") engine?.input(event.data.id, event.data.property, event.data.value);
  } catch (error) { fail(error); }
};
