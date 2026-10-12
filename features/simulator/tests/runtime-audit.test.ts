import { describe, expect, it } from "vitest";
import { SimulationEngine } from "../runtime/engine";
import { fixture } from "./fixtures";

const blinkWires = [["board.D3", "r.1"], ["r.2", "led.A"], ["led.K", "board.GND"]];
const program = (setup: string, loop: string) => `void setup(){${setup}}void loop(){${loop}}`;

describe("Arduino subset functional audit", () => {
  it("A — Blink uses setup once, loop, variables, while, delay and actual wired LED output", () => {
    const e = new SimulationEngine(fixture({ board: "uno", r: "resistor", led: "led" }, blinkWires,
      program('pinMode(3,OUTPUT);Serial.begin(9600);Serial.println("start");', 'int n=0;while(n<2){digitalWrite(3,HIGH);delay(40);digitalWrite(3,LOW);delay(40);n++;}Serial.println(n);')));
    expect([e.step().outputs.led, e.step().outputs.led, e.step().outputs.led, e.step().outputs.led]).toEqual([1, 0, 1, 0]);
    expect(e.time).toBe(160);
    for (let i = 0; i < 8; i++) e.step();
    expect(e.serial.split("start")).toHaveLength(2);
    expect(e.serial).toContain("2\n");
  });

  it("B — INPUT_PULLUP button drives the output only when actually grounded", () => {
    const e = new SimulationEngine(fixture({ board: "uno", led: "led", button: "button" }, [["board.D3", "led.A"], ["led.K", "board.GND"], ["button.1", "board.D2"], ["button.2", "board.GND"]], program("pinMode(2,INPUT_PULLUP);pinMode(3,OUTPUT);", "digitalWrite(3,digitalRead(2)==LOW);delay(10);")));
    expect(e.step().outputs.led).toBe(0);
    e.input("button", "pressed", 1); e.step(); expect(e.step().outputs.led).toBe(1);
    e.input("button", "pressed", 0); e.step(); expect(e.step().outputs.led).toBe(0);
  });

  it("C — analogRead and integer brightness conversion feed valid PWM", () => {
    const e = new SimulationEngine(fixture({ board: "uno", led: "led", pot: "pot" }, [["board.D3", "led.A"], ["led.K", "board.GND"], ["pot.VCC", "board.5V"], ["pot.GND", "board.GND"], ["pot.OUT", "board.A0"]], program("pinMode(3,OUTPUT);", "int brightness=analogRead(A0)/4;analogWrite(3,brightness);delay(10);")));
    expect(e.step().outputs.led).toBeCloseTo(128 / 255);
    e.input("pot", "value", 100); e.step(); expect(e.step().outputs.led).toBe(1);
    e.input("pot", "value", 0); e.step(); expect(e.step().outputs.led).toBe(0);
  });

  it("D — Serial begin/print/println produce program data and remain bounded", () => {
    const e = new SimulationEngine(fixture({ board: "uno" }, [], program("Serial.begin(9600);", 'int count=3;Serial.print("count=");Serial.println(count);delay(10);')));
    expect(e.step().serial).toBe("count=3\n");
    for (let i = 0; i < 6000; i++) e.step();
    expect(e.serial.length).toBeLessThanOrEqual(20000);
  });

  it("E — syntax, invalid pins and unsafe arithmetic produce readable diagnostics", () => {
    expect(() => new SimulationEngine(fixture({ board: "uno" }, [], "void setup(){pinMode(3 OUTPUT);}void loop(){}"))).toThrow(/Diharapkan/);
    for (const code of ["pinMode(99,OUTPUT);", "int x=1/0;"]) {
      const e = new SimulationEngine(fixture({ board: "uno" }, [], program(code, "delay(10);")));
      expect(() => e.step()).toThrow();
    }
  });

  it("F — unsupported APIs and includes fail explicitly instead of pretending to execute", () => {
    for (const api of ["tone(3,440);", "pulseIn(2,HIGH);", 'fetch("https://example.invalid");', "Servo.write(90);"]) {
      expect(() => new SimulationEngine(fixture({ board: "uno" }, [], program(api, "delay(10);")))).toThrow(/API belum didukung/);
    }
    expect(() => new SimulationEngine(fixture({ board: "uno" }, [], "#include <Servo.h>\nvoid setup(){}void loop(){}"))).toThrow(/Sintaks tidak didukung/);
  });

  it("G — an independent restart resets setup, virtual time and output deterministically", () => {
    const p = fixture({ board: "uno", r: "resistor", led: "led" }, blinkWires, program("pinMode(3,OUTPUT);", "digitalWrite(3,HIGH);delay(20);digitalWrite(3,LOW);delay(20);"));
    const e = new SimulationEngine(p); e.step(); e.step();
    expect(new SimulationEngine(p).step()).toEqual(new SimulationEngine(p).step());
    expect(new SimulationEngine(p).time).toBe(0);
  });

  it("H — direct shorts block Run, reversed or disconnected LEDs remain off", () => {
    expect(() => new SimulationEngine(fixture({ board: "uno" }, [["board.5V", "board.GND"]], program("", "delay(10);")))).toThrow(/hubung singkat/);
    const reversed = new SimulationEngine(fixture({ board: "uno", led: "led" }, [["board.D3", "led.K"], ["led.A", "board.GND"]], program("pinMode(3,OUTPUT);", "digitalWrite(3,HIGH);delay(10);")));
    expect(reversed.step().outputs.led).toBe(0);
    const disconnected = new SimulationEngine(fixture({ board: "uno", led: "led" }, [], program("", "delay(10);")));
    expect(disconnected.step().outputs.led).toBe(0);
  });

  it("infinite while loops exhaust an instruction budget and yields remain bounded", () => {
    const e = new SimulationEngine(fixture({ board: "uno" }, [], program("", "while(1){}")));
    expect(() => e.step()).toThrow(/budget instruksi/);
  });

  it("integer assignment truncates, float remains fractional, bool normalizes, and constants cannot change", () => {
    const e = new SimulationEngine(fixture({ board: "uno" }, [], `int n=1.9;float f=1.5;bool b=7;${program("Serial.begin(9600);", "n=n+2.9;Serial.print(n);Serial.print(f);Serial.println(b);delay(10);")}`));
    expect(e.step().serial).toBe("31.51\n");
    for (const declaration of ["const int n=1;", ""]) {
      const invalid = new SimulationEngine(fixture({ board: "uno" }, [], `${declaration}${program("", `${declaration ? "n" : "HIGH"}=0;delay(10);`)}`));
      expect(() => invalid.step()).toThrow(/Konstanta tidak dapat diubah/);
    }
  });
});
