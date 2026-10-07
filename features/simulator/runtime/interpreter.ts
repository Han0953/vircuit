import { CodeError, type Expr, type Program, type Statement } from "./language";
export type Value = number | string;
export interface RuntimeApi { call: (name: string, args: Value[], line: number) => Value }
export class Interpreter {
  private globals = new Map<string, Value>();
  private remaining = 20000;
  private generator: Generator<number>;
  constructor(program: Program, private api: RuntimeApi, constants: Record<string, Value> = {}) {
    this.globals = new Map(Object.entries({ HIGH: 1, LOW: 0, INPUT: 0, OUTPUT: 1, INPUT_PULLUP: 2, true: 1, false: 0, ...constants }));
    this.generator = this.run(program);
  }
  step(): number { this.remaining = 20000; const next = this.generator.next(); return next.done ? 1 : next.value; }
  private guard(line: number) { if (--this.remaining < 0) throw new CodeError("Program dihentikan: budget instruksi terlampaui. Tambahkan delay() pada loop.", line); }
  private evaluate(expr: Expr, locals: Map<string, Value>): Value {
    this.guard(expr.line);
    if (expr.kind === "value") return expr.value;
    if (expr.kind === "name") { const value = locals.get(expr.name) ?? this.globals.get(expr.name); if (value === undefined) throw new CodeError(`Variabel tidak dikenal: ${expr.name}`, expr.line); return value; }
    if (expr.kind === "call") { if (expr.name === "delay") throw new CodeError("delay() harus berupa statement mandiri.", expr.line); return this.api.call(expr.name, expr.args.map((arg) => this.evaluate(arg, locals)), expr.line); }
    if (expr.kind === "unary") { const v = this.evaluate(expr.value, locals); return expr.op === "!" ? Number(!v) : expr.op === "-" ? -Number(v) : Number(v); }
    const a = this.evaluate(expr.left, locals);
    if (expr.op === "&&" && !a) return 0;
    if (expr.op === "||" && a) return 1;
    const b = this.evaluate(expr.right, locals); const x = Number(a); const y = Number(b);
    switch (expr.op) {
      case "+": return typeof a === "string" || typeof b === "string" ? `${a}${b}`.slice(0, 2000) : x + y;
      case "-": return x - y; case "*": return x * y;
      case "/": case "%": if (!y) throw new CodeError("Pembagian dengan nol.", expr.line); return expr.op === "/" ? x / y : x % y;
      case "==": return Number(a === b); case "!=": return Number(a !== b);
      case "<": return Number(x < y); case ">": return Number(x > y); case "<=": return Number(x <= y); case ">=": return Number(x >= y);
      case "&&": return Number(Boolean(a && b)); case "||": return Number(Boolean(a || b));
      default: throw new CodeError("Operator tidak didukung.", expr.line);
    }
  }
  private *execute(statements: Statement[], locals: Map<string, Value>): Generator<number> {
    for (const statement of statements) {
      this.guard(statement.line);
      if (statement.kind === "declare" || statement.kind === "assign") {
        const target = statement.kind === "declare" || locals.has(statement.name) ? locals : this.globals;
        if (statement.kind === "assign" && !target.has(statement.name)) throw new CodeError(`Variabel tidak dikenal: ${statement.name}`, statement.line);
        target.set(statement.name, this.evaluate(statement.value, locals));
      } else if (statement.kind === "if") yield* this.execute(this.evaluate(statement.condition, locals) ? statement.yes : statement.no, locals);
      else if (statement.kind === "while") { while (this.evaluate(statement.condition, locals)) { this.guard(statement.line); yield* this.execute(statement.body, locals); } }
      else if (statement.value.kind === "call" && statement.value.name === "delay") {
        if (statement.value.args.length !== 1) throw new CodeError("delay() membutuhkan satu argumen.", statement.line);
        const duration = Number(this.evaluate(statement.value.args[0], locals));
        if (!Number.isFinite(duration) || duration < 0 || duration > 60000) throw new CodeError("delay harus 0–60000 ms.", statement.line);
        yield Math.max(1, duration);
      } else this.evaluate(statement.value, locals);
    }
  }
  private *run(program: Program): Generator<number> {
    yield* this.execute(program.globals, this.globals);
    yield* this.execute(program.setup, new Map());
    while (true) { yield* this.execute(program.loop, new Map()); yield 1; }
  }
}
