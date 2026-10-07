import { expect, it } from "vitest";
import { SimulationEngine } from "../runtime/engine";
import { parseProgram } from "../runtime/language";
import { fixture } from "./fixtures";
const wires = [["board.D13", "r.1"], ["r.2", "led.A"], ["led.K", "board.GND"]];
it("executes setup, loop, digital output, virtual delay and serial", () => {
  const p = fixture({ board: "uno", r: "resistor", led: "led" }, wires, 'void setup(){pinMode(13,OUTPUT);Serial.begin(9600);} void loop(){digitalWrite(13,HIGH);Serial.println("on");delay(500);digitalWrite(13,LOW);delay(500);}');
  const engine = new SimulationEngine(p);
  expect(engine.step()).toMatchObject({ outputs: { led: 1 }, delay: 500, serial: "on\n" });
  expect(engine.step()).toMatchObject({ outputs: { led: 0 }, time: 1000 });
});
it("reads button and maps potentiometer to PWM", () => {
  const p = fixture({ board: "uno", led: "led", pot: "pot", button: "button" }, [["board.D3", "led.A"], ["led.K", "board.GND"], ["pot.VCC", "board.5V"], ["pot.GND", "board.GND"], ["pot.OUT", "board.A0"], ["button.1", "board.D2"], ["button.2", "board.GND"]], 'void setup(){pinMode(3,OUTPUT);pinMode(2,INPUT_PULLUP);} void loop(){if(digitalRead(2)==LOW){analogWrite(3,128);}else{analogWrite(3,0);}delay(10);}');
  const engine = new SimulationEngine(p); expect(engine.step().outputs.led).toBe(0);
  engine.input("button", "pressed", 1); engine.step(); expect(engine.step().outputs.led).toBeCloseTo(128 / 255);
  expect(engine.electronics.signal("board", "A0")).toBe(0.5);
});
it("rejects unknown APIs, invalid PWM, division by zero and infinite loops", () => {
  expect(() => parseProgram('void setup(){fetch("x");}void loop(){}')).toThrow(/API/);
  for (const code of ["while(1){}", "int x=1/0;", "pinMode(13,OUTPUT);analogWrite(13,50);"]) {
    const engine = new SimulationEngine(fixture({ board: "uno" }, [], `void setup(){${code}}void loop(){}`));
    expect(() => engine.step()).toThrow();
  }
});
it("evaluates ESP32 DHT22 threshold relay and fan through arbitrary logical wiring", () => {
  const p = fixture({ board: "esp32", sensor: "dht22", relay: "relay", fan: "fan" }, [["sensor.VCC", "board.3V3"], ["sensor.GND", "board.GND"], ["sensor.DATA", "board.GPIO4"], ["relay.VCC", "board.5V"], ["relay.GND", "board.GND"], ["relay.IN", "board.GPIO23"], ["relay.COM", "board.5V"], ["relay.NO", "fan.+"], ["fan.-", "board.GND"]], 'void setup(){pinMode(23,OUTPUT);} void loop(){if(DHT.temperature(4)>30){digitalWrite(23,HIGH);}else{digitalWrite(23,LOW);}delay(100);}');
  const e = new SimulationEngine(p); expect(e.step().outputs.fan).toBe(0); e.input("sensor", "temperature", 35); e.step(); expect(e.step().outputs.fan).toBe(1);
});
