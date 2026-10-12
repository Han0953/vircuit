import { describe, expect, it } from "vitest";
import { replyRevealChunks } from "./reply-text";

describe("Cirra response reveal", () => {
  it("preserves code, whitespace and Unicode without splitting words", () => {
    const text = "Tegangan 3.3V → LED\n\nvoid loop() {\n  Serial.println(\"café\");\n}\n";
    const chunks = replyRevealChunks(text);
    expect(chunks.join("")).toBe(text);
    expect(chunks).toContain("→ ");
    expect(replyRevealChunks("")).toEqual([]);
    expect(replyRevealChunks("\n  \t").join("")).toBe("\n  \t");
  });
  it("bounds animation work for long answers", () => {
    const text = "Periksa koneksi dan jalankan simulasi. ".repeat(1000);
    const chunks = replyRevealChunks(text);
    expect(chunks.length).toBeLessThanOrEqual(80);
    expect(chunks.join("")).toBe(text);
    expect(replyRevealChunks("x".repeat(20000))).toHaveLength(1);
  });
});
