export const codeExamples = [
  { id: "blink", title: "Blink LED", description: "Nyalakan dan matikan LED secara bergantian.", topic: "Output digital" },
  { id: "led", title: "Nyalakan LED", description: "Mulai dari satu output digital yang stabil.", topic: "Dasar" },
  { id: "button", title: "Button → LED", description: "Kendalikan LED lewat input dengan pull-up.", topic: "Input digital" },
  { id: "pot", title: "Potentiometer → PWM", description: "Ubah kecerahan LED melalui input analog.", topic: "Analog" },
  { id: "dht", title: "DHT22 → Relay", description: "Aktifkan relay dan fan saat suhu di atas 30 °C.", topic: "Sensor" },
  { id: "traffic", title: "Lampu lalu lintas", description: "Atur urutan tiga LED dengan delay.", topic: "Mini proyek" },
  { id: "ldr", title: "Lampu otomatis LDR", description: "LED menyala ketika cahaya virtual rendah.", topic: "Sensor" },
  { id: "pir", title: "Deteksi gerakan PIR", description: "Gerakan mengaktifkan LED dan pesan Serial.", topic: "Sensor" },
  { id: "buzzer", title: "Buzzer aktif", description: "Amati indikator buzzer on/off, tanpa audio.", topic: "Aktuator" },
  { id: "lcd", title: "LCD · pembacaan analog", description: "Tampilkan nilai potentiometer pada LCD 16×2.", topic: "Display" },
  { id: "oled", title: "OLED · suhu & kelembapan", description: "Tampilkan data DHT22 pada layar OLED.", topic: "Display" },
  { id: "serial", title: "Serial · penghitung", description: "Cetak variabel counter pada Serial Monitor.", topic: "Debugging" },
] as const;
export type ExampleId = typeof codeExamples[number]["id"];
export function starterCode(kind: string, esp32: boolean) {
  const led = esp32 ? 23 : 3; const input = esp32 ? 4 : 2; const analog = esp32 ? "34" : "A0";
  if (kind === "button") return `void setup() {\n  pinMode(${led}, OUTPUT);\n  pinMode(${input}, INPUT_PULLUP);\n  Serial.begin(9600);\n}\nvoid loop() {\n  int pressed = digitalRead(${input}) == LOW;\n  digitalWrite(${led}, pressed);\n  Serial.println(pressed);\n  delay(20);\n}\n`;
  if (kind === "pot") return `void setup() {\n  pinMode(${led}, OUTPUT);\n  Serial.begin(9600);\n}\nvoid loop() {\n  int value = analogRead(${analog});\n  int brightness = value / ${esp32 ? 16 : 4};\n  analogWrite(${led}, brightness);\n  Serial.println(value);\n  delay(50);\n}\n`;
  if (kind === "dht") return `// DHT.temperature(pin): API virtual Vircuit, bukan library Arduino.\nvoid setup() {\n  pinMode(${led}, OUTPUT);\n  Serial.begin(9600);\n}\nvoid loop() {\n  float temperature = DHT.temperature(${input});\n  digitalWrite(${led}, temperature > 30);\n  Serial.println(temperature);\n  delay(100);\n}\n`;
  if (kind === "led") return `void setup() {\n  pinMode(${led}, OUTPUT);\n  digitalWrite(${led}, HIGH);\n}\nvoid loop() {\n  delay(100);\n}\n`;
  if (kind === "traffic") {
    const yellow = esp32 ? 25 : 5, green = esp32 ? 26 : 6;
    return `void setup() {\n  pinMode(${led}, OUTPUT);\n  pinMode(${yellow}, OUTPUT);\n  pinMode(${green}, OUTPUT);\n}\nvoid loop() {\n  digitalWrite(${led}, HIGH);\n  digitalWrite(${yellow}, LOW);\n  digitalWrite(${green}, LOW);\n  delay(1500);\n  digitalWrite(${led}, LOW);\n  digitalWrite(${green}, HIGH);\n  delay(1500);\n  digitalWrite(${green}, LOW);\n  digitalWrite(${yellow}, HIGH);\n  delay(500);\n}\n`;
  }
  if (kind === "ldr") return `void setup() {\n  pinMode(${led}, OUTPUT);\n  Serial.begin(9600);\n}\nvoid loop() {\n  int darkness = analogRead(${analog});\n  digitalWrite(${led}, darkness > ${esp32 ? 2047 : 511});\n  Serial.println(darkness);\n  delay(100);\n}\n`;
  if (kind === "pir") return `void setup() {\n  pinMode(${led}, OUTPUT);\n  pinMode(${input}, INPUT);\n  Serial.begin(9600);\n}\nvoid loop() {\n  int motion = digitalRead(${input});\n  digitalWrite(${led}, motion);\n  Serial.println(motion);\n  delay(100);\n}\n`;
  if (kind === "buzzer") return `// Buzzer aktif: indikator visual, tanpa audio.\nvoid setup() {\n  pinMode(${led}, OUTPUT);\n}\nvoid loop() {\n  digitalWrite(${led}, HIGH);\n  delay(250);\n  digitalWrite(${led}, LOW);\n  delay(250);\n}\n`;
  if (kind === "lcd") return `// API teks virtual Vircuit, bukan LiquidCrystal/Wire.\n// SDA: ${esp32 ? "GPIO21" : "A4"}, SCL: ${esp32 ? "GPIO22" : "A5"}. Alamat desimal 39.\nvoid setup() {\n  LCD.begin(39);\n  Serial.begin(9600);\n}\nvoid loop() {\n  int value = analogRead(${analog});\n  LCD.clear();\n  LCD.print("Input analog");\n  LCD.setCursor(0, 1);\n  LCD.print(value);\n  Serial.println(value);\n  delay(100);\n}\n`;
  if (kind === "oled") return `// API teks virtual Vircuit, bukan SSD1306/Wire.\n// setCursor(kolom, baris). SDA/SCL: ${esp32 ? "21/22" : "A4/A5"}.\nvoid setup() {\n  OLED.begin(60);\n  Serial.begin(9600);\n}\nvoid loop() {\n  float temperature = DHT.temperature(${input});\n  float humidity = DHT.humidity(${input});\n  OLED.clear();\n  OLED.print("Cuaca virtual");\n  OLED.setCursor(0, 2);\n  OLED.print("Suhu: ");\n  OLED.print(temperature);\n  OLED.setCursor(0, 4);\n  OLED.print("Lembap: ");\n  OLED.print(humidity);\n  Serial.println(temperature);\n  delay(100);\n}\n`;
  if (kind === "serial") return `int counter = 0;\nvoid setup() {\n  Serial.begin(9600);\n}\nvoid loop() {\n  Serial.print("Hitungan: ");\n  Serial.println(counter);\n  counter++;\n  delay(250);\n}\n`;
  return `void setup() {\n  pinMode(${led}, OUTPUT);\n}\nvoid loop() {\n  digitalWrite(${led}, HIGH);\n  delay(500);\n  digitalWrite(${led}, LOW);\n  delay(500);\n}\n`;
}
