import { useProject } from "../stores/project-store";
import { useSimulation } from "../stores/simulation-store";
import { validateCircuit } from "../graph/circuit";
import type { WorkerResponse, WorkerRequest } from "./protocol";
let worker: Worker | null = null;
let watchdog: ReturnType<typeof setTimeout> | undefined;
let unsubscribe: (() => void) | undefined;
function terminate() { worker?.terminate(); worker = null; clearTimeout(watchdog); unsubscribe?.(); unsubscribe = undefined; }
export function stopSimulation() { terminate(); useSimulation.setState({ status: "stopped" }); }
export function resetSimulation() { terminate(); useSimulation.setState({ status: "idle", outputs: {}, serial: "", time: 0, problems: [] }); }
export function runSimulation() {
  terminate(); const project = useProject.getState().project; const problems = validateCircuit(project);
  useSimulation.setState({ problems, outputs: {}, serial: "", time: 0, status: problems.some((p) => p.severity === "error") ? "error" : "running" });
  if (problems.some((p) => p.severity === "error")) return;
  worker = new Worker(new URL("./simulation.worker.ts", import.meta.url), { type: "module" });
  const active = worker;
  function arm() { clearTimeout(watchdog); watchdog = setTimeout(() => { if (worker !== active) return; terminate(); useSimulation.setState({ status: "error", problems: [{ id: "timeout", source: "runtime", severity: "error", message: "Worker tidak merespons. Simulasi dihentikan." }] }); }, 65000); }
  active.onmessage = (event: MessageEvent<WorkerResponse>) => {
    if (worker !== active) return;
    arm();
    if (event.data.type === "ERROR") { const problem = event.data.problem; terminate(); useSimulation.setState((s) => ({ status: "error", problems: [...s.problems, problem] })); }
    else useSimulation.setState({ outputs: event.data.outputs, serial: event.data.serial, time: event.data.time });
  };
  active.onerror = () => { terminate(); useSimulation.setState({ status: "error", problems: [{ id: "worker", source: "runtime", severity: "error", message: "Worker gagal dimuat. Muat ulang halaman lalu coba lagi." }] }); };
  const message: WorkerRequest = { type: "RUN", project }; active.postMessage(message); arm();
  unsubscribe = useProject.subscribe((s, previous) => { if (s.project.components !== previous.project.components || s.project.wires !== previous.project.wires || s.project.code !== previous.project.code) stopSimulation(); });
}
export function setSimulationInput(id: string, property: string, value: number) { const message: WorkerRequest = { type: "INPUT", id, property, value }; worker?.postMessage(message); }

export function clearSerial() { worker?.postMessage({ type: "CLEAR_SERIAL" } satisfies WorkerRequest); useSimulation.setState({ serial: "" }); }
