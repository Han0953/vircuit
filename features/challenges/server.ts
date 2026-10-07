import "server-only";
import { z } from "zod";
import { authenticatedClient } from "@/features/projects/server/service";
import { RequestError, requireSameOrigin, limitedJson } from "@/lib/request-security";
import { progressWriter } from "@/lib/supabase/writer";
import { findLesson } from "@/features/learning/registry";
import { submissionSchema } from "./contracts";
import { findChallenge } from "./registry";
import { evaluateSubmission, EvaluationLimitError } from "./evaluate";

export async function submitChallenge(request: Request) {
  requireSameOrigin(request);
  const { client, user } = await authenticatedClient();
  if (request.headers.get("x-vircuit-account") !== user.id) throw new RequestError("Session akun berubah. Masuk kembali ke akun pemilik submission.", 409);
  const parsed = submissionSchema.safeParse(await limitedJson(request, 2_000_000));
  if (!parsed.success) throw new RequestError("Submission tidak valid. Kirim snapshot, versi dan pilihan komponen saja.", 400);
  const input = parsed.data;
  const challenge = findChallenge(input.challengeId);
  if (!challenge || challenge.version !== input.version) throw new RequestError("Versi tantangan tidak tersedia.", 409);
  if (input.projectId) {
    const { data, error } = await client.from("projects").select("id").eq("id", input.projectId).eq("user_id", user.id).maybeSingle();
    if (error || !data) throw new RequestError("Project tidak ditemukan atau bukan milikmu.", 404);
  }
  const writer = progressWriter();
  // Yield before bounded CPU work so pending I/O can finish on the server.
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  let result;
  try { result = await evaluateSubmission(input, () => new Promise<void>((resolve) => setTimeout(resolve, 0))); }
  catch (cause) { if (cause instanceof EvaluationLimitError) throw new RequestError(cause.message, 422); throw cause; }
  const found = findLesson(challenge.lessonId)!;
  const summary = { requirements: result.requirements.map(({ id, status, code }) => ({ id, status, code })), diagnostics: result.diagnostics };
  const { data, error } = await writer.rpc("record_challenge_attempt", {
    p_user_id: user.id, p_operation_id: input.operationId, p_course_id: found.course.id, p_lesson_id: challenge.lessonId,
    p_challenge_id: challenge.id, p_challenge_version: challenge.version, p_evaluator_version: result.evaluatorVersion,
    p_engine_version: result.engineVersion, p_fingerprint: result.fingerprint, p_summary: summary,
    p_passed: result.passed, p_project_id: input.projectId,
  });
  if (error?.code === "40001") throw new RequestError("Submission ID sudah dipakai untuk snapshot lain. Evaluasi ulang.", 409);
  if (error?.code === "42501") throw new RequestError("Project tidak ditemukan atau akses ditolak.", 404);
  if (error?.code === "P0001") throw new RequestError("Terlalu banyak percobaan. Coba lagi nanti.", 429);
  if (error) throw new RequestError("Hasil belum tersinkronisasi. Preview dan draft lokal tetap tersedia.", 503);
  const attempt = z.object({ id: z.uuid(), passed: z.boolean(), fingerprint: z.string(), user_id: z.uuid() }).parse(data);
  if (attempt.user_id !== user.id || attempt.passed !== result.passed || attempt.fingerprint !== result.fingerprint) throw new RequestError("Konfirmasi hasil tidak sesuai. Coba lagi.", 503);
  return { verified: true as const, owner: user.id, operationId: input.operationId, attemptId: attempt.id, result };
}
