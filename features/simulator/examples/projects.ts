import { getDefinition } from "../catalog/registry";
import { componentGeometry } from "../geometry/component-geometry";
import { projectSchema } from "../schemas/project-schema";
import { emptyProject } from "../stores/project-store";
import { codeExamples, starterCode, type ExampleId } from "../runtime/templates";
import type { Project } from "../types/project";

export function exampleProject(id: ExampleId, esp32 = false): Project {
  const example = codeExamples.find((item) => item.id === id);
  if (!example) throw new Error("Contoh tidak tersedia.");
  const project = emptyProject();
  project.metadata.name = `Contoh: ${example.title}`;
  project.code.source = starterCode(id, esp32);
  const output = esp32 ? "GPIO23" : "D3", input = esp32 ? "GPIO4" : "D2", analog = esp32 ? "GPIO34" : "A0";
  function add(id: string, type: string, x: number, y: number, label?: string) {
    const definition = getDefinition(type);
    project.components.push({ id, type, label: label ?? definition.name, position: { x, y }, rotation: 0, properties: { ...definition.defaults } });
  }
  function wire(from: string, to: string) {
    const [componentId, pinId] = from.split("."), [targetId, targetPin] = to.split(".");
    project.wires.push({ id: `example-wire-${project.wires.length}`, from: { componentId, pinId }, to: { componentId: targetId, pinId: targetPin }, color: [pinId, targetPin].includes("GND") ? "neutral" : [pinId, targetPin].includes("5V") ? "red" : "blue" });
  }
  function power(id: string) { wire(`${id}.VCC`, "board.5V"); wire(`${id}.GND`, "board.GND"); }
  function led(id: string, pin: string, x: number, label = "LED") {
    add(`${id}-r`, "resistor", x, 40); add(id, "led", x + 36, 160, label);
    wire(`board.${pin}`, `${id}-r.1`); wire(`${id}-r.2`, `${id}.A`); wire(`${id}.K`, "board.GND");
  }
  add("board", esp32 ? "esp32" : "uno", 0, 0);
  project.settings.boardId = "board";
  if (["blink", "led", "button", "pot", "traffic", "ldr", "pir"].includes(id)) led("led", output, 760, id === "traffic" ? "Merah" : "LED");
  if (id === "traffic") { led("yellow", esp32 ? "GPIO25" : "D5", 960, "Kuning"); led("green", esp32 ? "GPIO26" : "D6", 1160, "Hijau"); }
  if (id === "button") { add("button", "button", 760, 320); wire("button.1", `board.${input}`); wire("button.2", "board.GND"); }
  if (id === "pot" || id === "lcd") { add("pot", "pot", 760, 320); power("pot"); wire("pot.OUT", `board.${analog}`); }
  if (id === "ldr") { add("ldr", "ldr", 760, 290); power("ldr"); wire("ldr.AO", `board.${analog}`); }
  if (id === "pir") { add("pir", "pir", 760, 290); power("pir"); wire("pir.OUT", `board.${input}`); }
  if (id === "buzzer") { add("buzzer", "buzzer", 760, 40); wire("buzzer.+", `board.${output}`); wire("buzzer.-", "board.GND"); }
  if (id === "dht" || id === "oled") { add("dht", "dht22", id === "oled" ? 1000 : 760, 40); power("dht"); wire("dht.DATA", `board.${input}`); }
  if (id === "dht") {
    add("relay", "relay", 960, 40); add("fan", "fan", 1220, 40); power("relay");
    wire("relay.IN", `board.${output}`); wire("relay.COM", "board.5V"); wire("relay.NO", "fan.+"); wire("fan.-", "board.GND");
  }
  if (id === "lcd" || id === "oled") {
    add("screen", id === "lcd" ? "lcd16x2" : "oled", 760, 40); power("screen");
    wire("screen.SDA", `board.${esp32 ? "GPIO21" : "A4"}`); wire("screen.SCL", `board.${esp32 ? "GPIO22" : "A5"}`);
  }
  project.viewport = fitExampleViewport(project, 850, 500);
  return projectSchema.parse(project);
}

export function fitExampleViewport(project: Project, width: number, height: number) {
  const bounds = project.components.map(componentGeometry).map((geometry) => geometry.bounds);
  const right = Math.max(...bounds.map((b) => b.x + b.width)), bottom = Math.max(...bounds.map((b) => b.y + b.height));
  const zoom = Math.max(.25, Math.min(1, (width - 48) / right, (height - 48) / bottom));
  return { x: 24, y: 24, zoom };
}
