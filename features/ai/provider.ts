import "server-only";
import { GoogleGenAI, ApiError } from "@google/genai";
import { z } from "zod";
import { responseSchema, type CirraMode } from "./contracts";
import { RequestError } from "@/lib/request-security";
export type ProviderInput = { apiKey: string; model: string; mode: CirraMode; system: string; data: string; allowedReferences?: string[]; timeoutMs: number; maxOutputTokens: number; signal: AbortSignal };
export async function generateCirra(input: ProviderInput) {
  const timeout = AbortSignal.timeout(input.timeoutMs);
  const signal = AbortSignal.any([input.signal, timeout]);
  const client = new GoogleGenAI({ apiKey: input.apiKey, httpOptions: { retryOptions: { attempts: 1 } } });
  const modeSchema = input.mode === "project-assistant" ? responseSchema.extend({ blueprint: responseSchema.shape.blueprint.unwrap() }) : responseSchema.omit({ blueprint: true });
  const constrained = input.allowedReferences ? modeSchema.extend({ references: input.allowedReferences.length ? z.array(z.enum(input.allowedReferences)).max(10) : z.array(z.string()).max(0) }) : modeSchema;
  const schema = z.toJSONSchema(constrained, { target: "draft-7" });
  const started = performance.now();
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      signal.throwIfAborted();
      const response = await client.models.generateContent({ model: input.model, contents: input.data, config: { systemInstruction: input.system, responseMimeType: "application/json", responseJsonSchema: schema, maxOutputTokens: input.maxOutputTokens, abortSignal: signal } });
      const text = response.text;
      if (!text || text.length > 16000) throw new RequestError("Aku belum mendapat jawaban yang valid. Coba kirim lagi; project kamu tetap aman.", 502);
      let result;
      try { result = constrained.parse(JSON.parse(text)); } catch { throw new RequestError("Aku belum mendapat jawaban yang valid. Coba kirim lagi; project kamu tetap aman.", 502); }
      if (result.mode !== input.mode) throw new RequestError("Jawaban Cirra belum sesuai mode. Coba lagi.", 502);
      return { result, tokens: response.usageMetadata?.totalTokenCount ?? 0, latency: Math.round(performance.now() - started) };
    } catch (cause) {
      if (input.signal.aborted) throw new RequestError("Permintaan Cirra dibatalkan.", 499);
      if (timeout.aborted) throw new RequestError("Aku membutuhkan waktu lebih lama dari batas layanan. Coba lagi sebentar.", 504);
      if (cause instanceof RequestError) throw cause;
      if (attempt === 0 && cause instanceof ApiError && [500, 502, 503].includes(cause.status)) {
        await new Promise<void>((resolve) => setTimeout(resolve, 250)); continue;
      }
      throw new RequestError(cause instanceof ApiError && cause.status === 429 ? "Aku sedang mencapai batas layanan. Coba lagi sebentar." : "Aku belum bisa terhubung ke Gemini sekarang. Project kamu tetap aman.", cause instanceof ApiError && cause.status === 429 ? 429 : 503);
    }
  }
  throw new RequestError("Cirra belum dapat menjawab sekarang.", 503);
}
