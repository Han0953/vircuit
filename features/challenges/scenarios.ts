import { SimulationEngine } from "@/features/simulator/runtime/engine";
import type { Project } from "@/features/simulator/types/project";
import type { Bindings, Evaluation } from "./contracts";
type Segment = Evaluation["evidence"][number];
export class EvaluationTimeout extends Error {}
export async function runScenario(project: Project, bindings: Bindings, scenario: string, yieldControl?: () => Promise<void>) {
  let engine = new SimulationEngine(project);
  let trace: Segment[] = [];
  const wallStart = performance.now();
  let steps = 0;
  let virtualTime = 0;
  const ids = [bindings.led, bindings.red_led, bindings.yellow_led, bindings.green_led].filter((id): id is string => Boolean(id));
  async function step() {
    if (steps >= 512 || virtualTime >= 10000) throw new Error("Batas langkah evaluasi tercapai. Gunakan interval yang lebih singkat.");
    if (performance.now() - wallStart > 2000) throw new EvaluationTimeout("Evaluasi melewati batas waktu. Coba lagi atau sederhanakan program.");
    const start = engine.time;
    const state = engine.step(); steps++;
    const outputs = Object.fromEntries(ids.map((id) => [id, state.outputs[id] ?? 0]));
    const end = Math.min(state.time, start + 10000 - virtualTime);
    virtualTime += end - start;
    const previous = trace.at(-1);
    if (previous && ids.every((id) => previous.outputs[id] === outputs[id])) previous.end = end;
    else if (end > start) trace.push({ start, end, outputs });
    if (yieldControl && steps % 32 === 0) await yieldControl();
    return outputs;
  }
  if (scenario === "button" || scenario === "pwm") {
    const trials = scenario === "button" ? [[0, 1, 0], [1, 0, 1]] : [[0, 25, 50, 75, 100], [100, 50, 0, 75, 25]];
    let evidence: Segment[] = [];
    for (const values of trials) {
      engine = new SimulationEngine(project); trace = [];
      const samples: number[] = [];
      for (const value of values) {
        engine.input(scenario === "button" ? bindings.button! : bindings.potentiometer!, scenario === "button" ? "pressed" : "value", value);
        const started = engine.time;
        let output: Record<string, number> = {};
        for (let n = 0; n < 45 && virtualTime < 10000 && engine.time - started < 1000; n++) output = await step();
        if (!Object.hasOwn(output, bindings.led!)) return { passed: false, evidence: trace.slice(0, 64) };
        samples.push(output[bindings.led!]);
      }
      if (!evidence.length) evidence = trace.slice(0, 64);
      const passed = samples.every((sample, i) => Math.abs(sample - (scenario === "button" ? values[i] : values[i] / 100)) < 0.1);
      if (!passed) return { passed: false, evidence };
    }
    return { passed: true, evidence };
  }
  while (steps < 512 && virtualTime < 10000) await step();
  const positive = trace.filter((t) => t.end > t.start);
  let passed = false;
  if (scenario === "steady") passed = positive.length > 0 && positive.every((t) => t.outputs[bindings.led!] > 0.9);
  if (scenario === "blink") {
    const states = positive.map((t) => t.outputs[bindings.led!] > 0.9 ? 1 : t.outputs[bindings.led!] === 0 ? 0 : -1);
    passed = states.length >= 4 && !states.includes(-1) && states.every((s, i) => i === 0 || states[i - 1] !== s);
  }
  if (scenario === "traffic") {
    const states = positive.map((t) => {
      const values = [bindings.red_led!, bindings.green_led!, bindings.yellow_led!].map((id) => t.outputs[id]);
      return values.filter((v) => v > 0).length === 1 && values.some((v) => v > 0.9) ? values.findIndex((v) => v > 0.9) : -1;
    });
    passed = states.length >= 6 && states.every((state, index) => state === index % 3);
  }
  return { passed, evidence: trace.slice(0, 64) };
}
