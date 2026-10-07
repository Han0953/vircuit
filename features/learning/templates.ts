import { getDefinition } from "@/features/simulator/catalog/registry";
import { projectSchema } from "@/features/simulator/schemas/project-schema";
import { emptyProject } from "@/features/simulator/stores/project-store";
import { starterCode } from "@/features/simulator/runtime/templates";
import type { Project } from "@/features/simulator/types/project";
import type { Lesson } from "./schema";

export function practiceProject(lesson: Lesson): Project {
  const practice = lesson.practice;
  if (!practice) throw new Error("Lesson ini tidak memiliki praktik.");
  const kind = practice.template;
  const parts: [string, string][] = [["board", "uno"], ["r", "resistor"], ["led", "led"]];
  const connections = [["board.D3", "r.1"], ["r.2", "led.A"], ["led.K", "board.GND"]];
  if (kind === "button") {
    parts.push(["button", "button"]); connections.push(["button.1", "board.D2"], ["button.2", "board.GND"]);
  }
  if (kind === "pot") {
    parts.push(["pot", "pot"]); connections.push(["pot.VCC", "board.5V"], ["pot.GND", "board.GND"], ["pot.OUT", "board.A0"]);
  }
  if (kind === "traffic") {
    parts.push(["r-yellow", "resistor"], ["yellow", "led"], ["r-green", "resistor"], ["green", "led"]);
    connections.push(["board.D5", "r-yellow.1"], ["r-yellow.2", "yellow.A"], ["yellow.K", "board.GND"], ["board.D6", "r-green.1"], ["r-green.2", "green.A"], ["green.K", "board.GND"]);
  }
  const project = emptyProject();
  project.metadata.name = `Praktik: ${lesson.title}`;
  project.components = parts.map(([id, type], index) => ({ id, type, label: kind === "traffic" && type === "led" ? ({ led: "Merah", yellow: "Kuning", green: "Hijau" }[id] ?? "LED") : getDefinition(type).name, properties: { ...getDefinition(type).defaults }, position: { x: index === 0 ? 0 : 300 + ((index - 1) % 3) * 220, y: index === 0 ? 0 : Math.floor((index - 1) / 3) * 180 }, rotation: 0 }));
  project.settings.boardId = "board";
  project.wires = kind === "led-wiring" ? [] : connections.map(([from, to], n) => {
    const [componentId, pinId] = from.split("."); const [targetId, targetPin] = to.split(".");
    return { id: `wire-${n}`, from: { componentId, pinId }, to: { componentId: targetId, pinId: targetPin }, color: "blue" };
  });
  project.code.source = kind === "pot" ? "void setup(){pinMode(3,OUTPUT);Serial.begin(9600);}\nvoid loop(){int value=analogRead(A0);int pwm=(value-value%4)/4;analogWrite(3,pwm);Serial.println(value);delay(50);}" : kind === "traffic" ? "void setup(){\n  pinMode(3,OUTPUT);\n  pinMode(5,OUTPUT);\n  pinMode(6,OUTPUT);\n}\nvoid loop(){\n  // Lengkapi urutan merah, hijau, dan kuning.\n  delay(100);\n}" : starterCode(kind === "button" ? "button" : "blink", false);
  if (kind === "debug") project.code.source = project.code.source.replaceAll("(3,", "(4,");
  return projectSchema.parse(project);
}
