import { z } from "zod";
import { learningId } from "@/features/learning/schema";
import { projectSchema } from "@/features/simulator/schemas/project-schema";

export const roleSchema = z.enum(["board", "led", "button", "potentiometer", "red_led", "yellow_led", "green_led"]);
export const behaviorSchema = z.enum(["steady", "blink", "button", "pwm", "traffic"]);
const ruleBase = { id: learningId, message: z.string().min(1), hint: z.string().min(1) };
export const ruleSchema = z.discriminatedUnion("type", [
  z.object({ ...ruleBase, type: z.literal("component_roles") }),
  z.object({ ...ruleBase, type: z.literal("electrical_path") }),
  z.object({ ...ruleBase, type: z.literal("circuit_valid") }),
  z.object({ ...ruleBase, type: z.literal("program_valid") }),
  z.object({ ...ruleBase, type: z.literal("behavior_scenario"), scenario: behaviorSchema }),
]);
export const challengeSchema = z.object({
  id: learningId, version: z.number().int().positive(), lessonId: learningId, practiceId: learningId,
  title: z.string().min(1), objective: z.string().min(1), order: z.number().int().positive(),
  skills: z.array(z.string().min(1)).min(1), roles: z.array(roleSchema).min(2),
  requirements: z.array(ruleSchema).min(1),
}).superRefine((value, ctx) => {
  if (new Set(value.roles).size !== value.roles.length || new Set(value.requirements.map((r) => r.id)).size !== value.requirements.length)
    ctx.addIssue({ code: "custom", message: "Role dan requirement harus unik." });
});
export const bindingsSchema = z.partialRecord(roleSchema, z.string().min(1).max(100));
export const submissionSchema = z.strictObject({
  challengeId: learningId, version: z.number().int().positive(), operationId: z.uuid(),
  project: projectSchema, bindings: bindingsSchema, projectId: z.uuid().nullable().default(null),
});
export type Challenge = z.infer<typeof challengeSchema>;
export type Role = z.infer<typeof roleSchema>;
export type Bindings = z.infer<typeof bindingsSchema>;
export type Submission = z.infer<typeof submissionSchema>;
export const evaluationSchema = z.object({
  challengeId: learningId, version: z.number().int().positive(), evaluatorVersion: z.string().max(40), engineVersion: z.string().max(40),
  submissionId: z.uuid(), fingerprint: z.string().regex(/^[a-f0-9]{64}$/), passed: z.boolean(),
  requirements: z.array(z.object({ id: learningId, status: z.enum(["satisfied", "unmet", "blocked"]), code: z.string().max(100), message: z.string().max(1000), hint: z.string().max(1000), hintRef: learningId })).max(20),
  evidence: z.array(z.object({ start: z.number().nonnegative(), end: z.number().nonnegative(), outputs: z.record(z.string().max(100), z.number().finite()) })).max(64),
  diagnostics: z.array(z.string().max(2000)).max(10),
});
export const verifiedResultSchema = z.object({ verified: z.literal(true), owner: z.uuid(), operationId: z.uuid(), attemptId: z.uuid(), result: evaluationSchema });
export type Evaluation = z.infer<typeof evaluationSchema>;
export type RequirementResult = Evaluation["requirements"][number];
