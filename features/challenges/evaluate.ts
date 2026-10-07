import { validateCircuit } from "@/features/simulator/graph/circuit";
import { parseProgram } from "@/features/simulator/runtime/language";
import { submissionSchema, type Evaluation, type Submission } from "./contracts";
import { findChallenge } from "./registry";
import { bindingsComplete, resolveBindings } from "./bindings";
import { validLedPaths } from "./electrical";
import { runScenario, EvaluationTimeout } from "./scenarios";
import { getDefinition } from "@/features/simulator/catalog/registry";

export const EVALUATOR_VERSION = "1";
export const ENGINE_VERSION = "arduino-subset-1";
export class EvaluationLimitError extends Error {}
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0);
    return "{" + entries.map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(",") + "}";
  }
  return JSON.stringify(value);
}
export async function evaluateSubmission(raw: Submission, yieldControl?: () => Promise<void>): Promise<Evaluation> {
  const submission = submissionSchema.parse(raw);
  const challenge = findChallenge(submission.challengeId);
  if (!challenge || challenge.version !== submission.version) throw new Error("Versi tantangan tidak tersedia. Buka kembali lesson.");
  const project = submission.project;
  const pinCount = project.components.reduce((sum, c) => sum + getDefinition(c.type).pins.length, 0);
  if (project.components.length > 40 || project.wires.length > 200 || pinCount > 3000) throw new EvaluationLimitError("Evaluasi MVP dibatasi 40 komponen, 200 kabel dan 3000 pin. Sederhanakan rangkaian tantangan.");
  const bindings = resolveBindings(project, challenge, submission.bindings);
  const bytes = new TextEncoder().encode(canonical({ project, bindings, challenge: challenge.id, version: challenge.version, evaluator: EVALUATOR_VERSION, engine: ENGINE_VERSION }));
  const fingerprint = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)), (b) => b.toString(16).padStart(2, "0")).join("");
  const diagnostics = validateCircuit(project).filter((p) => p.severity === "error").map((p) => p.message);
  const roles = bindingsComplete(challenge, bindings);
  let program = true;
  try { parseProgram(project.code.source); } catch (error) { program = false; diagnostics.push(error instanceof Error ? error.message.slice(0, 500) : "Program tidak valid."); }
  const circuit = !validateCircuit(project).some((p) => p.severity === "error");
  let behavior = false; let evidence: Evaluation["evidence"] = [];
  if (roles && circuit && program) {
    try {
      const scenario = challenge.requirements.find((r) => r.type === "behavior_scenario");
      if (scenario?.type === "behavior_scenario") ({ passed: behavior, evidence } = await runScenario(project, bindings, scenario.scenario, yieldControl));
    } catch (error) {
      if (error instanceof EvaluationTimeout) throw new EvaluationLimitError(error.message);
      program = false; diagnostics.push(error instanceof Error ? error.message.slice(0, 500) : "Runtime tidak dapat dievaluasi.");
    }
  }
  const values = { component_roles: roles, circuit_valid: circuit, electrical_path: roles && validLedPaths(project, bindings), program_valid: program, behavior_scenario: behavior };
  const requirements = challenge.requirements.map((rule) => ({
    id: rule.id, status: values[rule.type] ? "satisfied" as const : rule.type === "behavior_scenario" && (!roles || !circuit || !program) ? "blocked" as const : "unmet" as const,
    code: `${rule.type}.${values[rule.type] ? "satisfied" : "unmet"}`, message: rule.message, hint: rule.hint, hintRef: `${challenge.id}.${rule.id}`,
  }));
  return { challengeId: challenge.id, version: challenge.version, evaluatorVersion: EVALUATOR_VERSION, engineVersion: ENGINE_VERSION, submissionId: submission.operationId, fingerprint, passed: requirements.every((r) => r.status === "satisfied"), requirements, evidence, diagnostics: diagnostics.slice(0, 10) };
}
