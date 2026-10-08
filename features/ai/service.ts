import "server-only";
import { authenticatedClient } from "@/features/projects/server/service";
import { requireSameOrigin, limitedJson, RequestError } from "@/lib/request-security";
import { findLesson } from "@/features/learning/registry";
import { requestSchema } from "./contracts";
import { cirraConfig } from "./config";
import { buildContext } from "./context";
import { modelCategory } from "./model-router";
import { buildPrompt, validateAnswer, PROMPT_VERSION } from "./prompts";
import { generateCirra } from "./provider";
import { reserveRequest, type UsageResult } from "./server-limits";
import { enrichContext } from "./server-context";

export async function answerCirra(request: Request) {
  requireSameOrigin(request);
  const { client, user } = await authenticatedClient();
  if (request.headers.get("x-vircuit-account") !== user.id) throw new RequestError("Session akun berubah. Masuk kembali sebelum bertanya ke Cirra.", 409);
  const parsed = requestSchema.safeParse(await limitedJson(request, 180000));
  if (!parsed.success) throw new RequestError("Konteks atau pertanyaan Cirra belum valid. Periksa ukuran project dan mode yang dipilih.", 400);
  const input = parsed.data;
  if (input.lessonId && !findLesson(input.lessonId)) throw new RequestError("Materi tidak ditemukan.", 400);
  if (input.projectId) {
    const { data, error } = await client.from("projects").select("id").eq("id", input.projectId).eq("user_id", user.id).maybeSingle();
    if (error || !data) throw new RequestError("Project tidak ditemukan atau bukan milikmu.", 404);
  }
  const config = cirraConfig();
  if (request.signal.aborted) throw new RequestError("Permintaan Cirra dibatalkan.", 499);
  const lease = await reserveRequest(user.id, input.requestId, input.mode, config);
  const started = performance.now();
  let usage: UsageResult = { status: "error", latencyMs: 0 };
  try {
    buildContext(input, {}, config.maxContextChars);
    const facts = await enrichContext(input, { client, user });
    const built = buildContext(input, facts, config.maxContextChars);
    const category = modelCategory(input, built.context.diagnostics.length > 0 || Boolean(facts.evaluation && !facts.evaluation.passed), config.override);
    const prompt = buildPrompt(input, built);
    const response = await generateCirra({ apiKey: config.apiKey, model: category === "FAST" ? config.fast : config.smart, mode: input.mode, ...prompt, timeoutMs: config.timeoutMs, maxOutputTokens: config.maxOutputTokens, signal: request.signal });
    const result = validateAnswer(response.result, input, built);
    usage = { status: "ok", category, tokens: response.tokens, latencyMs: response.latency };
    console.info(JSON.stringify({ event: "cirra", requestId: input.requestId, mode: input.mode, modelCategory: category, promptVersion: PROMPT_VERSION, status: "ok", latencyMs: response.latency, tokens: response.tokens }));
    return { requestId: input.requestId, result, modelCategory: category, context: built.meta };
  } catch (cause) {
    usage.status = request.signal.aborted ? "canceled" : "error";
    usage.latencyMs = Math.round(performance.now() - started);
    console.info(JSON.stringify({ event: "cirra", requestId: input.requestId, mode: input.mode, status: cause instanceof RequestError ? cause.status : 503, latencyMs: Math.round(performance.now() - started) }));
    throw cause;
  } finally { await lease.finish(usage); }
}
