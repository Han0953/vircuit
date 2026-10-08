import "server-only";
import { z } from "zod";
import type { authenticatedClient } from "@/features/projects/server/service";
import { evaluateSubmission } from "@/features/challenges/evaluate";
import { findChallenge } from "@/features/challenges/registry";
import { progressRowSchema } from "@/features/progress/contracts";
import type { CirraRequest } from "./contracts";
import type { ContextFacts } from "./context";
export async function enrichContext(input: CirraRequest, auth: Awaited<ReturnType<typeof authenticatedClient>>): Promise<ContextFacts> {
  const facts: ContextFacts = { unavailable: [] };
  if (input.lessonId) {
    try {
      const { data, error } = await auth.client.from("learning_progress").select("*").eq("user_id", auth.user.id).eq("lesson_id", input.lessonId).maybeSingle();
      if (error) throw new Error("unavailable");
      if (data) { const row = progressRowSchema.parse(data); if (row.user_id === auth.user.id) facts.progress = row.status; }
    } catch { facts.unavailable!.push("progress unavailable; do not invent completion"); }
  }
  if (input.challengeId) {
    const challenge = findChallenge(input.challengeId);
    if (challenge && input.project) {
      try {
        facts.evaluation = await evaluateSubmission({ challengeId: challenge.id, version: challenge.version, operationId: input.requestId, project: input.project, bindings: input.bindings, projectId: input.projectId ?? null }, () => new Promise<void>((resolve) => setTimeout(resolve, 0)));
      } catch { facts.unavailable!.push("current deterministic evaluation unavailable; retain static hints"); }
    }
    try {
      const { data, error } = await auth.client.from("challenge_attempts").select("user_id,passed,fingerprint").eq("user_id", auth.user.id).eq("challenge_id", input.challengeId).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (error) throw new Error("unavailable");
      if (data) {
        const row = z.object({ user_id: z.uuid(), passed: z.boolean(), fingerprint: z.string().regex(/^[a-f0-9]{64}$/) }).parse(data);
        if (row.user_id === auth.user.id && facts.evaluation?.fingerprint === row.fingerprint) facts.verifiedAttempt = { passed: row.passed, fingerprint: row.fingerprint };
        else facts.unavailable!.push("previous attempt does not prove current snapshot");
      }
    } catch { facts.unavailable!.push("verified attempt unavailable"); }
  }
  return facts;
}
