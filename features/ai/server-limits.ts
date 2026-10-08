import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseEnv } from "@/lib/supabase/env";
import { RequestError } from "@/lib/request-security";
import { developmentLimits, type LimitPolicy } from "./limits";
import type { CirraMode } from "./contracts";
export type UsageResult = { status: "ok" | "error" | "canceled"; category?: "FAST" | "SMART"; tokens?: number; latencyMs: number };
export async function reserveRequest(owner: string, requestId: string, mode: CirraMode, config: LimitPolicy & { limiter: string }) {
  if (config.limiter === "memory" && (process.env.NODE_ENV !== "production" || process.env.CIRRA_LOCAL_PREVIEW === "1")) {
    const lease = developmentLimits.reserve(owner, requestId, config);
    return { finish: async () => { lease.finish(); } };
  }
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (config.limiter !== "database" || !secret?.startsWith("sb_secret_")) throw new RequestError("Batas penggunaan Cirra belum dikonfigurasi di server. Project kamu tetap aman.", 503);
  const client = createClient(supabaseEnv().url, secret, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  const { data, error } = await client.rpc("reserve_cirra_request", { p_user_id: owner, p_request_id: requestId, p_mode: mode, p_minute: config.minuteLimit, p_day: config.dayLimit, p_concurrency: config.concurrency, p_timeout_ms: config.timeoutMs });
  if (error) throw new RequestError("Pembatas Cirra belum dapat diakses. Coba lagi nanti.", 503);
  if (data === "duplicate") throw new RequestError("Permintaan ini sudah dikirim. Coba lagi dengan permintaan baru.", 409);
  if (data === "concurrent" || data === "limited") throw new RequestError("Batas penggunaan Cirra sedang tercapai atau ada permintaan aktif. Coba lagi nanti.", 429);
  if (data !== "reserved") throw new RequestError("Pembatas Cirra belum dapat diakses.", 503);
  return { finish: async (result: UsageResult) => {
    try {
      const { error: finishError } = await client.rpc("finish_cirra_request", { p_user_id: owner, p_request_id: requestId, p_status: result.status, p_model_category: result.category ?? null, p_tokens: result.tokens ?? null, p_latency_ms: result.latencyMs });
      if (finishError) throw new Error("release");
    } catch {
      // A failed release expires automatically. Never log RPC errors or private payloads.
      console.warn(JSON.stringify({ event: "cirra_usage_release_failed", requestId }));
    }
  } };
}
