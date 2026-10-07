export function starterCode(kind: string, esp32: boolean) {
  const led = esp32 ? 23 : 3; const input = esp32 ? 4 : 2; const analog = esp32 ? "34" : "A0";
  if (kind === "button") return `void setup() {\n  pinMode(${led}, OUTPUT);\n  pinMode(${input}, INPUT_PULLUP);\n  Serial.begin(9600);\n}\nvoid loop() {\n  int pressed = digitalRead(${input}) == LOW;\n  digitalWrite(${led}, pressed);\n  Serial.println(pressed);\n  delay(20);\n}\n`;
  if (kind === "pot") return `void setup() {\n  pinMode(${led}, OUTPUT);\n  Serial.begin(9600);\n}\nvoid loop() {\n  int value = analogRead(${analog});\n  if (value > ${esp32 ? 2047 : 511}) { analogWrite(${led}, 255); }\n  else { analogWrite(${led}, 32); }\n  Serial.println(value);\n  delay(50);\n}\n`;
  if (kind === "dht") return `// DHT.temperature(pin): API virtual Vircuit, bukan library Arduino.\nvoid setup() {\n  pinMode(${led}, OUTPUT);\n  Serial.begin(9600);\n}\nvoid loop() {\n  float temperature = DHT.temperature(${input});\n  digitalWrite(${led}, temperature > 30);\n  Serial.println(temperature);\n  delay(100);\n}\n`;
  return `void setup() {\n  pinMode(${led}, OUTPUT);\n}\nvoid loop() {\n  digitalWrite(${led}, HIGH);\n  delay(500);\n  digitalWrite(${led}, LOW);\n  delay(500);\n}\n`;
}
