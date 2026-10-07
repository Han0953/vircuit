import { describe, expect, it, vi } from "vitest";
import { findLesson } from "@/features/learning/registry";
import { practiceProject } from "@/features/learning/templates";
import { evaluateSubmission } from "./evaluate";
import { challengeStarter } from "./starter";
import type { Bindings } from "./contracts";
function input(suffix = "blink", code?: string) {
  const project = practiceProject(findLesson(`lesson.${suffix === "led-resistor" ? "blink" : suffix}`)!.lesson);
  if (code) project.code.source = code;
  const bindings: Bindings = suffix === "traffic" ? { red_led: "led", yellow_led: "yellow", green_led: "green" } : {};
  return { project, challengeId: `challenge.${suffix}`, version: 1, operationId: "b1bba135-6ebd-4f9f-b601-c91290b01bd1", bindings, projectId: null };
}
const steady = "void setup(){pinMode(3,OUTPUT);digitalWrite(3,HIGH);}void loop(){delay(100);}";
describe("deterministic evaluation", () => {
  it("passes steady LED and alternate pin, rejects bypass, wrong ground and missing LED", async () => {
    const data = input("led-resistor", steady);
    expect((await evaluateSubmission(data)).passed).toBe(true);
    data.project.code.source = steady.replaceAll("(3,", "(5,"); data.project.wires[0].from.pinId = "D5";
    expect((await evaluateSubmission(data)).passed).toBe(true);
    data.project.wires.push({ id: "bypass", from: { componentId: "board", pinId: "D5" }, to: { componentId: "led", pinId: "A" }, color: "red" });
    expect((await evaluateSubmission(data)).passed).toBe(false);
    const ground = input("led-resistor", steady); ground.project.wires[2].to.pinId = "5V";
    expect((await evaluateSubmission(ground)).passed).toBe(false);
    const missing = input(); missing.project.components = missing.project.components.filter((c) => c.type !== "led"); missing.project.wires = [];
    expect((await evaluateSubmission(missing)).passed).toBe(false);
  });
  it("observes repeated Blink, not final output, rejects malformed programs", async () => {
    expect((await evaluateSubmission(input())).passed).toBe(true);
    expect((await evaluateSubmission(input("blink", steady))).passed).toBe(false);
    expect((await evaluateSubmission(input("blink", "void setup(){pinMode(3,OUTPUT);digitalWrite(3,HIGH);delay(100);digitalWrite(3,LOW);}void loop(){delay(100);}"))).passed).toBe(false);
    expect((await evaluateSubmission(input("blink", "invalid"))).passed).toBe(false);
  });
  it("checks released/pressed/released and graded analog input", async () => {
    expect((await evaluateSubmission(input("button"))).passed).toBe(true);
    expect((await evaluateSubmission(input("button", steady))).passed).toBe(false);
    expect((await evaluateSubmission(input("pot"))).passed).toBe(true);
    expect((await evaluateSubmission(input("pot", steady))).passed).toBe(false);
    const timed = "int i=0;void setup(){pinMode(3,OUTPUT);}void loop(){i=i+1;if(i<23){digitalWrite(3,LOW);}else{if(i<45){digitalWrite(3,HIGH);}else{digitalWrite(3,LOW);}}delay(25);}";
    expect((await evaluateSubmission(input("button", timed))).passed).toBe(false);
  });
  it("checks debug correction and ordered traffic, rejecting simultaneous lights", async () => {
    expect((await evaluateSubmission(input("debug"))).passed).toBe(false);
    const debug = input("debug"); debug.project.code.source = debug.project.code.source.replaceAll("(4,", "(3,");
    expect((await evaluateSubmission(debug)).passed).toBe(true);
    const starter = { ...input("debug"), project: challengeStarter(findLesson("lesson.debug")!.lesson) };
    starter.project.code.source = input().project.code.source;
    expect((await evaluateSubmission(starter)).passed).toBe(false);
    starter.project.wires[2].to.pinId = "GND";
    expect((await evaluateSubmission(starter)).passed).toBe(true);
    const source = "void setup(){pinMode(3,OUTPUT);pinMode(5,OUTPUT);pinMode(6,OUTPUT);}void loop(){digitalWrite(5,LOW);digitalWrite(3,HIGH);delay(500);digitalWrite(3,LOW);digitalWrite(6,HIGH);delay(500);digitalWrite(6,LOW);digitalWrite(5,HIGH);delay(500);}";
    expect((await evaluateSubmission(input("traffic", source))).passed).toBe(true);
    expect((await evaluateSubmission(input("traffic", source.replace("digitalWrite(3,LOW);", "")))).passed).toBe(false);
    expect((await evaluateSubmission(input("traffic", source.replaceAll("(6,", "(9,").replaceAll("(5,", "(6,").replaceAll("(9,", "(5,")))).passed).toBe(false);
  });
  it("is immutable and deterministic; bounds infinite loops", async () => {
    const data = input(); const original = structuredClone(data);
    expect(await evaluateSubmission(data)).toEqual(await evaluateSubmission(data));
    expect(data).toEqual(original);
    expect((await evaluateSubmission(input("blink", "void setup(){}void loop(){while(1){}}"))).passed).toBe(false);
  });
  it("does not grade an operational timeout as a failed learning requirement", async () => {
    const clock = vi.spyOn(performance, "now").mockReturnValueOnce(0).mockReturnValue(3000);
    try { await expect(evaluateSubmission(input())).rejects.toThrow("batas waktu"); }
    finally { clock.mockRestore(); }
  });
  it("accepts different component IDs and breadboard-mediated wiring", async () => {
    const data = input("led-resistor", steady);
    const replacements: Record<string, string> = { board: "mcu", r: "current-limiter", led: "output" };
    data.project.components.forEach((c) => { c.id = replacements[c.id]; c.position.x += 500; });
    data.project.settings.boardId = "mcu";
    data.project.wires.forEach((w) => { w.from.componentId = replacements[w.from.componentId]; w.to.componentId = replacements[w.to.componentId]; });
    data.project.components.push({ id: "breadboard", type: "breadboard-mini", label: "Breadboard", rotation: 90, position: { x: 1000, y: 300 }, properties: {} });
    data.project.wires[0].to = { componentId: "breadboard", pinId: "A1" };
    data.project.wires.push({ id: "group-wire", from: { componentId: "breadboard", pinId: "B1" }, to: { componentId: "current-limiter", pinId: "1" }, color: "green" });
    expect((await evaluateSubmission(data)).passed).toBe(true);
  });
});
