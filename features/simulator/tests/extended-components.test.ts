import { describe, expect, it } from "vitest";
import { getDefinition } from "../catalog/registry";
import { deserializeProject, serializeProject } from "../schemas/project-schema";
import { buildCircuit, validateCircuit } from "../graph/circuit";
import { validConnection } from "../validation/wires";
import { SimulationEngine } from "../runtime/engine";
import { fixture } from "./fixtures";

describe("additional component contracts", () => {
  for (const type of ["ldr", "hcsr04", "pir", "buzzer", "servo", "lcd16x2", "oled"]) it(`${type}: stable pins, wiring, properties and snapshot v1 roundtrip`, () => {
    const d = getDefinition(type);
    const p = fixture({ board: "uno", part: type }, [], "void setup(){}void loop(){delay(10);}");
    p.components[1].rotation = 90;
    for (const pin of d.pins) {
      const from = { componentId: "part", pinId: pin.id }, to = { componentId: "board", pinId: pin.kind === "ground" ? "GND" : pin.kind === "power" ? "5V" : "D2" };
      expect(validConnection(p, from, to)).toBe(true);
      p.wires.push({ id: `wire-${pin.id}`, from, to, color: "blue" });
    }
    expect(deserializeProject(serializeProject(p))).toEqual(p);
    const graph = buildCircuit(p);
    expect(graph.netByPin.has(`part.${d.pins[0].id}`)).toBe(true);
    const warnings = validateCircuit(p).filter((problem) => problem.id === "visual-only-part");
    expect(warnings).toHaveLength(d.support === "visual-only" ? 1 : 0);
  });

  it("LDR AO decreases with virtual light and DO is active-low above threshold", () => {
    const p = fixture({ board: "uno", sensor: "ldr" }, [["sensor.VCC", "board.5V"], ["sensor.GND", "board.GND"], ["sensor.AO", "board.A0"], ["sensor.DO", "board.D2"]], 'void setup(){pinMode(2,INPUT);Serial.begin(9600);}void loop(){Serial.print(analogRead(A0));Serial.print(":");Serial.println(digitalRead(2));delay(10);}');
    const e = new SimulationEngine(p); e.input("sensor", "light", 20);
    expect(e.step().serial).toContain("818:1\n");
    e.input("sensor", "light", 80); e.step();
    expect(e.step().serial).toContain("205:0\n");
    e.input("sensor", "light", 999); expect(e.electronics.inputs.sensor.light).toBe(100);
    e.input("sensor", "light", Number.NaN); expect(e.electronics.inputs.sensor.light).toBe(100);
  });

  it("PIR input drives an active buzzer through arbitrary digital wiring", () => {
    const p = fixture({ board: "uno", motion: "pir", sound: "buzzer" }, [["motion.VCC", "board.5V"], ["motion.GND", "board.GND"], ["motion.OUT", "board.D2"], ["board.D3", "sound.+"], ["sound.-", "board.GND"]], 'void setup(){pinMode(2,INPUT);pinMode(3,OUTPUT);}void loop(){digitalWrite(3,digitalRead(2));delay(20);}');
    const e = new SimulationEngine(p); expect(e.step().outputs.sound).toBe(0);
    e.input("motion", "motion", 1); e.step(); expect(e.step().outputs.sound).toBe(1);
    e.input("motion", "motion", 0); e.step(); expect(e.step().outputs.sound).toBe(0);
  });

  it("unpowered sensors do not synthesize readings and disconnected buzzers stay off", () => {
    const p = fixture({ board: "esp32", sensor: "ldr", pir: "pir", buzzer: "buzzer" }, [["sensor.AO", "board.GPIO34"], ["pir.OUT", "board.GPIO4"]], 'void setup(){Serial.begin(9600);}void loop(){Serial.println(analogRead(34));delay(10);}');
    const e = new SimulationEngine(p);
    expect(e.step()).toMatchObject({ serial: "0\n", outputs: { buzzer: 0 } });
    expect(e.electronics.signal("board", "GPIO4")).toBeUndefined();
  });
});
