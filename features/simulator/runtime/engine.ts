import { getDefinition } from "../catalog/registry";
import { validateCircuit } from "../graph/circuit";
import { projectSchema } from "../schemas/project-schema";
import { CodeError, parseProgram } from "./language";
import { Interpreter, type Value } from "./interpreter";
import { Electronics } from "./electronics";
import type { Project } from "../types/project";
export class SimulationEngine {
  readonly electronics: Electronics;
  readonly interpreter: Interpreter;
  serial = "";
  time = 0;
  private serialStarted = false;
  constructor(project: Project) {
    projectSchema.parse(project);
    const error = validateCircuit(project).find((p) => p.severity === "error");
    if (error) throw new Error(error.message);
    const board = project.components.find((c) => ["uno", "esp32"].includes(c.type))!;
    this.electronics = new Electronics(project, board);
    const constants: Record<string, Value> = { LED_BUILTIN: board.type === "esp32" ? 2 : 13 };
    for (let i = 0; i < 6; i++) constants[`A${i}`] = 14 + i;
    this.interpreter = new Interpreter(parseProgram(project.code.source), { call: (name, args, line) => this.call(name, args, line) }, constants);
  }
  private call(name: string, args: Value[], line: number): Value {
    const arity: Record<string, number> = { pinMode: 2, digitalWrite: 2, digitalRead: 1, analogRead: 1, analogWrite: 2, "Serial.begin": 1, "Serial.print": 1, "Serial.println": 1, "DHT.temperature": 1, "DHT.humidity": 1 };
    if (args.length !== arity[name]) throw new CodeError(`${name} membutuhkan ${arity[name]} argumen.`, line);
    if (name.startsWith("Serial.")) {
      if (name === "Serial.begin") { if (!(Number(args[0]) > 0)) throw new CodeError("Baud rate tidak valid.", line); this.serialStarted = true; }
      else { if (!this.serialStarted) throw new CodeError("Panggil Serial.begin() sebelum mencetak.", line); this.serial = (this.serial + String(args[0]).slice(0, 2000) + (name === "Serial.println" ? "\n" : "")).slice(-20000); }
      return 0;
    }
    const runtime = this.electronics; const n = Number(args[0]);
    const pinId = runtime.board.type === "esp32" ? `GPIO${n}` : n >= 14 ? `A${n - 14}` : `D${n}`;
    const pin = getDefinition(runtime.board.type).pins.find((p) => p.id === pinId);
    if (!pin || !Number.isInteger(n)) throw new CodeError(`Pin ${args[0]} tidak didukung board ini.`, line);
    const value = Number(args[1]);
    if (name === "pinMode") {
      if (![0, 1, 2].includes(value) || (value === 1 && !pin.output) || (value === 2 && runtime.board.type === "esp32" && n >= 34)) throw new CodeError("Mode pin tidak didukung.", line);
      runtime.modes[pinId] = value; delete runtime.pins[pinId]; return 0;
    }
    if (name === "digitalWrite" || name === "analogWrite") {
      if (runtime.modes[pinId] !== 1 || !pin.output) throw new CodeError(`Atur ${pinId} sebagai OUTPUT terlebih dahulu.`, line);
      if (name === "analogWrite" && (!pin.pwm || !Number.isInteger(value) || value < 0 || value > 255)) throw new CodeError("PWM membutuhkan pin PWM dan nilai 0–255.", line);
      if (name === "digitalWrite" && value !== 0 && value !== 1) throw new CodeError("digitalWrite membutuhkan HIGH atau LOW.", line);
      runtime.pins[pinId] = name === "analogWrite" ? value / 255 : value; return 0;
    }
    if (name === "digitalRead") return Number((runtime.signal(runtime.board.id, pinId) ?? (runtime.modes[pinId] === 2 ? 1 : 0)) >= 0.5);
    if (name === "analogRead") {
      if (!pin.analog) throw new CodeError(`${pinId} tidak mendukung analogRead.`, line);
      return Math.round((runtime.signal(runtime.board.id, pinId) ?? 0) * (runtime.board.type === "esp32" ? 4095 : 1023));
    }
    if (name.startsWith("DHT.")) {
      const net = runtime.graph.netByPin.get(`${runtime.board.id}.${pinId}`);
      const sensor = runtime.project.components.find((c) => c.type === "dht22" && runtime.graph.netByPin.get(`${c.id}.DATA`) === net);
      if (!sensor || !runtime.powered(sensor.id)) throw new CodeError("DHT22 harus terhubung ke pin data, power, dan GND.", line);
      return runtime.inputs[sensor.id][name === "DHT.temperature" ? "temperature" : "humidity"];
    }
    throw new CodeError(`API tidak didukung: ${name}`, line);
  }
  step() { const delay = this.interpreter.step(); const outputs = this.electronics.outputs(); this.time += delay; return { delay, outputs, time: this.time, serial: this.serial }; }
  input(id: string, property: string, value: number) {
    const component = this.electronics.project.components.find((c) => c.id === id);
    const allowed = component?.type === "button" ? ["pressed"] : component?.type === "pot" ? ["value"] : component?.type === "dht22" ? ["temperature", "humidity"] : [];
    if (!allowed.includes(property) || !Number.isFinite(value)) return;
    this.electronics.inputs[id][property] = property === "temperature" ? Math.max(-40, Math.min(80, value)) : property === "pressed" ? Number(Boolean(value)) : Math.max(0, Math.min(100, value));
  }
}
