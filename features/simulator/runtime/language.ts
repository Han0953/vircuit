export class CodeError extends Error { constructor(message: string, public line: number) { super(message); } }
export interface Token { value: string; line: number; kind: "number" | "string" | "word" | "symbol" }
export type Expr = { kind: "value"; value: number | string; line: number } | { kind: "name"; name: string; line: number } | { kind: "call"; name: string; args: Expr[]; line: number } | { kind: "binary"; op: string; left: Expr; right: Expr; line: number } | { kind: "unary"; op: string; value: Expr; line: number };
export type Statement = { kind: "declare" | "assign"; name: string; value: Expr; line: number } | { kind: "expression"; value: Expr; line: number } | { kind: "if"; condition: Expr; yes: Statement[]; no: Statement[]; line: number } | { kind: "while"; condition: Expr; body: Statement[]; line: number };
export interface Program { globals: Statement[]; setup: Statement[]; loop: Statement[] }
const apis = new Set(["pinMode", "digitalWrite", "digitalRead", "analogRead", "analogWrite", "delay", "Serial.begin", "Serial.print", "Serial.println", "DHT.temperature", "DHT.humidity"]);
export function tokenize(source: string): Token[] {
  if (source.length > 20000) throw new CodeError("Kode melebihi 20.000 karakter.", 1);
  const tokens: Token[] = []; let offset = 0; let line = 1;
  const pattern = /\s+|\/\/[^\n]*|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|\d+(?:\.\d+)?|[A-Za-z_]\w*(?:\.[A-Za-z_]\w*)?|==|!=|<=|>=|&&|\|\||\+\+|--|[{}();,+\-*/%<>=!]/y;
  while (offset < source.length) {
    pattern.lastIndex = offset; const match = pattern.exec(source);
    if (!match) throw new CodeError(`Sintaks tidak didukung: ${source[offset]}`, line);
    const value = match[0]; const startLine = line; line += (value.match(/\n/g) ?? []).length; offset += value.length;
    if (/^\s|^\/\//.test(value) || value.startsWith("/*")) continue;
    tokens.push({ value, line: startLine, kind: value.startsWith('"') ? "string" : /^\d/.test(value) ? "number" : /^[A-Za-z_]/.test(value) ? "word" : "symbol" });
    if (tokens.length > 5000) throw new CodeError("Program terlalu besar.", line);
  }
  return [...tokens, { value: "EOF", line, kind: "symbol" }];
}
export function parseProgram(source: string): Program {
  const tokens = tokenize(source); let index = 0; let depth = 0;
  const peek = () => tokens[index];
  const take = () => tokens[index++];
  function expect(value: string) { if (peek().value !== value) throw new CodeError(`Diharapkan '${value}', ditemukan '${peek().value}'.`, peek().line); return take(); }
  function name() { const token = take(); if (token.kind !== "word" || token.value.includes(".")) throw new CodeError("Nama variabel tidak valid.", token.line); return token.value; }
  const precedence: Record<string, number> = { "||": 1, "&&": 2, "==": 3, "!=": 3, "<": 4, ">": 4, "<=": 4, ">=": 4, "+": 5, "-": 5, "*": 6, "/": 6, "%": 6 };
  function expression(min = 0): Expr {
    if (++depth > 80) throw new CodeError("Ekspresi terlalu dalam.", peek().line);
    const token = take(); let left: Expr;
    if (token.value === "(" ) { left = expression(); expect(")"); }
    else if (["!", "-", "+"].includes(token.value)) left = { kind: "unary", op: token.value, value: expression(7), line: token.line };
    else if (token.kind === "number") left = { kind: "value", value: Number(token.value), line: token.line };
    else if (token.kind === "string") { try { left = { kind: "value", value: JSON.parse(token.value), line: token.line }; } catch { throw new CodeError("String tidak valid.", token.line); } }
    else if (token.kind === "word") {
      if (peek().value === "(") {
        if (!apis.has(token.value)) throw new CodeError(`API belum didukung: ${token.value}`, token.line);
        take(); const args: Expr[] = [];
        if (peek().value !== ")") { do { args.push(expression()); if (peek().value !== ",") break; take(); } while (true); }
        expect(")"); left = { kind: "call", name: token.value, args, line: token.line };
      } else left = { kind: "name", name: token.value, line: token.line };
    } else throw new CodeError(`Ekspresi tidak didukung: ${token.value}`, token.line);
    while ((precedence[peek().value] ?? -1) >= min) { const op = take(); left = { kind: "binary", op: op.value, left, right: expression(precedence[op.value] + 1), line: op.line }; }
    depth--; return left;
  }
  function body(): Statement[] {
    if (++depth > 80) throw new CodeError("Blok terlalu dalam.", peek().line);
    const result: Statement[] = [];
    if (peek().value !== "{") result.push(statement());
    else { take(); while (peek().value !== "}") { if (peek().value === "EOF") throw new CodeError("Blok belum ditutup.", peek().line); result.push(statement()); } expect("}"); }
    depth--; return result;
  }
  function statement(): Statement {
    const token = peek();
    if (["if", "while"].includes(token.value)) {
      take(); expect("("); const condition = expression(); expect(")"); const block = body();
      if (token.value === "while") return { kind: "while", condition, body: block, line: token.line };
      const no = peek().value === "else" ? (take(), body()) : [];
      return { kind: "if", condition, yes: block, no, line: token.line };
    }
    if (["const", "int", "float", "double", "bool", "long", "unsigned", "byte"].includes(token.value)) {
      while (["const", "int", "float", "double", "bool", "long", "unsigned", "byte"].includes(peek().value)) take();
      const variable = name(); const value: Expr = peek().value === "=" ? (take(), expression()) : { kind: "value", value: 0, line: token.line }; expect(";");
      return { kind: "declare", name: variable, value, line: token.line };
    }
    if (tokens[index + 1]?.value === "=" || ["++", "--"].includes(tokens[index + 1]?.value)) {
      const variable = name(); const operator = take();
      const value: Expr = operator.value === "=" ? expression() : { kind: "binary", op: operator.value === "++" ? "+" : "-", left: { kind: "name", name: variable, line: token.line }, right: { kind: "value", value: 1, line: token.line }, line: token.line };
      expect(";"); return { kind: "assign", name: variable, value, line: token.line };
    }
    const value = expression(); expect(";"); return { kind: "expression", value, line: token.line };
  }
  const program: Program = { globals: [], setup: [], loop: [] }; const functions = new Set<string>();
  while (peek().value !== "EOF") {
    if (peek().value !== "void") { program.globals.push(statement()); continue; }
    take(); const fn = name(); if (fn !== "setup" && fn !== "loop") throw new CodeError("Hanya fungsi setup() dan loop() yang didukung.", peek().line);
    if (functions.has(fn)) throw new CodeError(`Fungsi ${fn} duplikat.`, peek().line);
    expect("("); expect(")"); program[fn] = body(); functions.add(fn);
  }
  if (!functions.has("setup") || !functions.has("loop")) throw new CodeError("Program harus memiliki setup() dan loop().", 1);
  return program;
}
