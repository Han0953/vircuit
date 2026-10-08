import { z } from "zod";
import { projectSchema } from "@/features/simulator/schemas/project-schema";
import { learningId } from "@/features/learning/schema";
import { bindingsSchema } from "@/features/challenges/contracts";

export const modeSchema = z.enum(["tutor", "debugger", "project-assistant"]);
const problemSchema = z.strictObject({ id: z.string().max(100), message: z.string().max(1000), severity: z.enum(["error", "warning", "info"]), source: z.enum(["code", "runtime", "wiring", "board"]), componentId: z.string().max(100).optional(), line: z.number().int().positive().optional() });
export const runtimeSchema = z.strictObject({ status: z.enum(["idle", "running", "stopped", "error"]), time: z.number().finite().nonnegative(), outputs: z.record(z.string().max(100), z.number().finite()), serial: z.string().max(10000), problems: z.array(problemSchema).max(40) });
export const requestSchema = z.strictObject({
  requestId: z.uuid(), mode: modeSchema, message: z.string().trim().min(1).max(2000),
  lessonId: learningId.optional(), challengeId: learningId.optional(), hintLevel: z.number().int().min(1).max(3).default(1),
  projectId: z.uuid().optional(), project: projectSchema.optional(), runtime: runtimeSchema.optional(),
  bindings: bindingsSchema.default({}), selectedProblemId: z.string().max(100).optional(),
  history: z.array(z.strictObject({ role: z.enum(["user", "assistant"]), text: z.string().max(4000) })).max(8).default([]),
});
export const responseSchema = z.strictObject({
  mode: modeSchema, answer: z.string().min(1).max(6000),
  observations: z.array(z.string().max(600)).max(5),
  suggestions: z.array(z.string().max(600)).max(6),
  hints: z.array(z.string().max(600)).max(3),
  references: z.array(z.string().max(100)).max(10),
  blueprint: z.strictObject({
    goal: z.string().min(1).max(400),
    constraints: z.array(z.string().max(300)).min(1).max(4),
    components: z.array(z.strictObject({ name: z.string().min(1).max(100), catalogType: z.string().max(100).nullable(), support: z.enum(["partial", "visual-only", "not-available"]) })).min(1).max(8),
    circuitPlan: z.array(z.string().max(300)).min(1).max(6),
    programStructure: z.array(z.string().max(300)).min(1).max(6),
    testing: z.array(z.string().max(300)).min(1).max(6),
  }).optional(),
});
export type CirraRequest = z.infer<typeof requestSchema>;
export type CirraResponse = z.infer<typeof responseSchema>;
export type CirraMode = z.infer<typeof modeSchema>;
export const replySchema = z.object({ requestId: z.uuid(), result: responseSchema, modelCategory: z.enum(["FAST", "SMART"]), context: z.object({ sources: z.array(z.string()), truncated: z.array(z.string()), challengeActive: z.boolean(), hintLevel: z.number(), fingerprint: z.string().optional() }) });
export type CirraReply = z.infer<typeof replySchema>;
