import { CodeError } from "./language";
import type { Value } from "./interpreter";
import type { Electronics } from "./electronics";

export interface DisplayState { columns: number; rows: number; lines: string[] }
export class DisplayRuntime {
  private active = new Map<string, string>();
  private buffers = new Map<string, DisplayState & { column: number; row: number }>();
  constructor(private electronics: Electronics) {}

  call(name: string, args: Value[], line: number): number {
    const [family, method] = name.split(".");
    const type = family === "LCD" ? "lcd16x2" : "oled";
    const arity: Record<string, number> = { begin: 1, clear: 0, setCursor: 2, print: 1 };
    if (args.length !== arity[method]) throw new CodeError(`${name} membutuhkan ${arity[method]} argumen.`, line);
    if (method === "begin") {
      const address = args[0];
      if (typeof address !== "number" || !Number.isInteger(address) || address < 8 || address > 119) throw new CodeError("Alamat I2C harus 8–119 dalam desimal.", line);
      const runtime = this.electronics;
      const matches = runtime.project.components.filter((c) => ["lcd16x2", "oled"].includes(c.type) && c.properties.address === address);
      if (matches.length !== 1 || matches[0].type !== type) throw new CodeError(`${family}: gunakan satu display dengan alamat ${address}. Periksa properti alamat I2C.`, line);
      const component = matches[0];
      const pins = runtime.board.type === "esp32" ? ["GPIO21", "GPIO22"] : ["A4", "A5"];
      const connected = (pin: string, boardPin: string) => runtime.graph.netByPin.get(`${component.id}.${pin}`) === runtime.graph.netByPin.get(`${runtime.board.id}.${boardPin}`);
      if (!runtime.powered(component.id) || !connected("SDA", pins[0]) || !connected("SCL", pins[1])) throw new CodeError(`${family}: hubungkan VCC/GND dan SDA → ${pins[0]}, SCL → ${pins[1]}.`, line);
      const sda = runtime.graph.netByPin.get(`${component.id}.SDA`), scl = runtime.graph.netByPin.get(`${component.id}.SCL`);
      const rails = ["GND", "5V", "3V3"].map((pin) => runtime.graph.netByPin.get(`${runtime.board.id}.${pin}`));
      if (sda === scl || rails.includes(sda) || rails.includes(scl)) throw new CodeError(`${family}: SDA dan SCL harus terpisah dari satu sama lain serta dari power/GND.`, line);
      const columns = type === "lcd16x2" ? 16 : 21, rows = type === "lcd16x2" ? 2 : 8;
      this.buffers.set(component.id, { columns, rows, lines: Array.from({ length: rows }, () => " ".repeat(columns)), column: 0, row: 0 });
      this.active.set(family, component.id);
      return 0;
    }
    const id = this.active.get(family), display = id ? this.buffers.get(id) : undefined;
    if (!display) throw new CodeError(`Panggil ${family}.begin(alamat) sebelum menulis display.`, line);
    if (method === "clear") { display.lines.fill(" ".repeat(display.columns)); display.column = 0; display.row = 0; }
    else if (method === "setCursor") {
      const [column, row] = args;
      if (typeof column !== "number" || typeof row !== "number" || !Number.isInteger(column) || !Number.isInteger(row) || column < 0 || column >= display.columns || row < 0 || row >= display.rows) throw new CodeError(`${family}.setCursor: kolom 0–${display.columns - 1}, baris 0–${display.rows - 1}.`, line);
      display.column = column; display.row = row;
    } else if (method === "print") {
      const text = Array.from(String(args[0]).replace(/[\r\n\t]/g, " ")).slice(0, display.columns - display.column).join("");
      const previous = display.lines[display.row];
      display.lines[display.row] = previous.slice(0, display.column) + text + previous.slice(display.column + text.length);
      display.column += text.length;
    }
    return 0;
  }
  snapshot(): Record<string, DisplayState> {
    return Object.fromEntries([...this.buffers].map(([id, { columns, rows, lines }]) => [id, { columns, rows, lines: [...lines] }]));
  }
}
