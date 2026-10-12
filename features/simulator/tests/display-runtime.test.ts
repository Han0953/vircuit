import { describe, expect, it } from "vitest";
import { SimulationEngine } from "../runtime/engine";
import { fixture } from "./fixtures";
import { serializeProject, deserializeProject } from "../schemas/project-schema";

function circuit(type: "lcd16x2" | "oled", source: string, esp32 = false) {
  return fixture({ board: esp32 ? "esp32" : "uno", screen: type }, [["screen.VCC", "board.5V"], ["screen.GND", "board.GND"], ["screen.SDA", `board.${esp32 ? "GPIO21" : "A4"}`], ["screen.SCL", `board.${esp32 ? "GPIO22" : "A5"}`]], source);
}
describe("bounded text display runtime", () => {
  it.each([false, true])("writes LCD text and live numeric input on board ESP32=%s", (esp32) => {
    const project = circuit("lcd16x2", `void setup(){LCD.begin(39);}void loop(){LCD.clear();LCD.print("Sensor");LCD.setCursor(0,1);LCD.print(analogRead(${esp32 ? "34" : "A0"}));delay(10);}`, esp32);
    const engine = new SimulationEngine(project);
    const state = engine.step();
    expect(state.displays.screen.lines.map((s) => s.trimEnd())).toEqual(["Sensor", "0"]);
    expect(deserializeProject(serializeProject(project))).toEqual(project);
    expect(serializeProject(project)).not.toContain('"displays"');
  });
  it("OLED has bounded 21×8 rows, cursor placement and clear/update", () => {
    const engine = new SimulationEngine(circuit("oled", 'void setup(){OLED.begin(60);OLED.print("abcdefghijklmnopqrstuvwxyz");OLED.setCursor(2,7);OLED.print(123);delay(10);OLED.clear();OLED.print("Baru");}void loop(){delay(10);}'));
    expect(engine.step().displays.screen.lines[0]).toBe("abcdefghijklmnopqrstu");
    expect(engine.displays.snapshot().screen.lines[7]).toBe("  123                ");
    expect(engine.step().displays.screen.lines.map((s) => s.trimEnd())).toEqual(["Baru", "", "", "", "", "", "", ""]);
  });
  it("snapshot copies cannot mutate the display buffer and fresh runtime resets it", () => {
    const project = circuit("lcd16x2", 'void setup(){LCD.begin(39);LCD.print("A");}void loop(){delay(10);}');
    const engine = new SimulationEngine(project), state = engine.step(); state.displays.screen.lines[0] = "changed";
    expect(engine.displays.snapshot().screen.lines[0].trim()).toBe("A");
    expect(new SimulationEngine(project).displays.snapshot()).toEqual({});
  });
  it.each(["VCC", "GND", "SDA", "SCL"])("rejects missing %s wiring", (pin) => {
    const project = circuit("lcd16x2", "void setup(){LCD.begin(39);}void loop(){delay(10);}");
    project.wires = project.wires.filter((w) => w.from.pinId !== pin);
    expect(() => new SimulationEngine(project).step()).toThrow(/hubungkan VCC\/GND/);
  });
  it.each(["LCD.print(1);", "LCD.begin(38);", "LCD.begin(39);LCD.setCursor(16,0);", "LCD.begin(39);LCD.setCursor(0,2);", "LCD.begin(39);LCD.print();", "LCD.begin(39);LCD.setCursor(1.5,0);"])("reports invalid display command: %s", (command) => {
    expect(() => new SimulationEngine(circuit("lcd16x2", `void setup(){${command}}void loop(){delay(10);}`)).step()).toThrow();
  });
  it("rejects duplicate bus address and unsupported library API explicitly", () => {
    const project = circuit("lcd16x2", "void setup(){LCD.begin(39);}void loop(){delay(10);}");
    project.components.push({ ...project.components[1], id: "duplicate" });
    expect(() => new SimulationEngine(project).step()).toThrow(/gunakan satu display/);
    expect(() => new SimulationEngine(circuit("oled", "void setup(){OLED.drawBitmap(1);}void loop(){delay(10);}"))).toThrow(/API belum didukung/);
  });
  it("rejects shorted I2C lines even when both expected board pins are connected", () => {
    const project = circuit("lcd16x2", "void setup(){LCD.begin(39);}void loop(){delay(10);}");
    project.wires.push({ ...project.wires[0], id: "short", from: { componentId: "screen", pinId: "SDA" }, to: { componentId: "screen", pinId: "SCL" } });
    expect(() => new SimulationEngine(project).step()).toThrow(/SDA dan SCL harus terpisah/);
  });
});
