import "server-only";
import { z } from "zod";
import { RequestError } from "@/lib/request-security";
const numeric = (value: string | undefined, fallback: number, min: number, max: number) => z.coerce.number().int().min(min).max(max).parse(value ?? fallback);
export function cirraConfig() {
  const model = z.string().regex(/^gemini-[a-z0-9.-]+$/).max(100);
  try {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes("PASTE_")) throw new Error("missing");
    return {
      apiKey: process.env.GEMINI_API_KEY,
      fast: model.parse(process.env.CIRRA_MODEL_FAST), smart: model.parse(process.env.CIRRA_MODEL_SMART),
      timeoutMs: numeric(process.env.CIRRA_TIMEOUT_MS, 25000, 1000, 60000),
      maxOutputTokens: numeric(process.env.CIRRA_MAX_OUTPUT_TOKENS, 1800, 256, 4000),
      maxContextChars: numeric(process.env.CIRRA_MAX_CONTEXT_CHARS, 24000, 8000, 40000),
      minuteLimit: numeric(process.env.CIRRA_REQUESTS_PER_MINUTE, 6, 1, 60),
      dayLimit: numeric(process.env.CIRRA_REQUESTS_PER_DAY, 60, 1, 1000),
      concurrency: numeric(process.env.CIRRA_CONCURRENT_REQUESTS, 1, 1, 3),
      limiter: process.env.CIRRA_LIMIT_STORE ?? (process.env.NODE_ENV === "production" ? "database" : "memory"),
      override: z.enum(["FAST", "SMART"]).optional().parse(process.env.CIRRA_MODEL_OVERRIDE || undefined),
    };
  } catch { throw new RequestError("Aku belum terhubung ke layanan Cirra. Konfigurasi server perlu diperiksa; project kamu tetap aman.", 503); }
}
