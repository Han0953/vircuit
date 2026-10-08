import { findLesson } from "@/features/learning/registry";
import { findChallenge, lessonChallenge } from "@/features/challenges/registry";
import { buildCircuit, validateCircuit } from "@/features/simulator/graph/circuit";
import { parseProgram } from "@/features/simulator/runtime/language";
import { catalog, getDefinition } from "@/features/simulator/catalog/registry";
import type { Evaluation } from "@/features/challenges/contracts";
import type { CirraRequest } from "./contracts";
import { boundedText, sanitizeText } from "./sanitize";
import { RequestError } from "@/lib/request-security";

export type ContextFacts = { evaluation?: Evaluation; progress?: "in_progress" | "completed"; verifiedAttempt?: { passed: boolean; fingerprint: string }; unavailable?: string[] };
export function wantsProject(input: CirraRequest) {
  return input.mode !== "tutor" || Boolean(input.challengeId || input.selectedProblemId) || /rangkaian|wiring|kode|error|debug|project|proyek/i.test(input.message);
}
export function buildContext(input: CirraRequest, facts: ContextFacts = {}, budget = 24000) {
  const lesson = input.lessonId ? findLesson(input.lessonId) : undefined;
  if (input.lessonId && !lesson) throw new RequestError("Materi yang kamu pilih belum tersedia.", 400);
  const challenge = input.challengeId ? findChallenge(input.challengeId) : undefined;
  if (input.challengeId && (!challenge || challenge.lessonId !== input.lessonId)) throw new RequestError("Konteks tantangan tidak sesuai materi.", 400);
  const active = challenge ?? (lesson ? lessonChallenge(lesson.lesson.id) : undefined);
  const sources = ["auth: server verified"];
  const truncated: string[] = [];
  const project = wantsProject(input) ? input.project : undefined;
  if (project && (project.components.length > 40 || project.wires.length > 200 || project.components.reduce((n, c) => n + getDefinition(c.type).pins.length, 0) > 3000)) throw new RequestError("Rangkaian ini terlalu besar untuk konteks Cirra MVP. Maksimal 40 komponen, 200 kabel dan 3000 pin.", 413);
  const diagnostics: { id: string; message: string; line?: number; componentId?: string; source: string }[] = [];
  let circuit;
  let normalizedProject;
  let code: { language: string; numbered: string; truncated: boolean } | undefined;
  if (project) {
    const graph = buildCircuit(project);
    const attached = new Set(project.wires.flatMap((w) => [`${w.from.componentId}.${w.from.pinId}`, `${w.to.componentId}.${w.to.pinId}`]));
    circuit = { connections: project.wires.map((w) => ({ from: `${w.from.componentId}.${w.from.pinId}`, to: `${w.to.componentId}.${w.to.pinId}` })), nets: [...graph.nets.values()].filter((pins) => pins.some((p) => attached.has(p))).slice(0, 60) };
    const board = project.components.find((c) => c.id === project.settings.boardId);
    normalizedProject = { title: boundedText(project.metadata.name, 200), board: board ? { id: board.id, type: board.type, pins: getDefinition(board.type).pins } : null, components: project.components.map((c) => ({ id: c.id, type: c.type, label: boundedText(c.label, 100), pins: getDefinition(c.type).pins.filter((pin) => getDefinition(c.type).pins.length <= 80 || attached.has(`${c.id}.${pin.id}`)).slice(0, 80), properties: Object.fromEntries(Object.entries(c.properties).filter(([key]) => key in getDefinition(c.type).defaults)) })) };
    for (const component of project.components) if (getDefinition(component.type).pins.length > 80) truncated.push(`pin metadata: ${component.id}; connected pins only`);
    diagnostics.push(...validateCircuit(project, graph).slice(0, 20).map((p) => ({ ...p, message: boundedText(p.message, 500) })));
    try { parseProgram(project.code.source); } catch (cause) { diagnostics.push({ id: "program-parse", source: "parser: server", message: boundedText(cause instanceof Error ? cause.message : "Program tidak valid.", 500) }); }
    const clean = sanitizeText(project.code.source);
    const snippet = boundedText(clean, 8000);
    code = { language: project.code.language, numbered: snippet.split("\n").map((line, i) => `${i + 1}: ${line}`).join("\n"), truncated: clean.length > 8000 };
    if (code.truncated) truncated.push("code");
    sources.push("project/circuit: validated browser draft", "parser/graph: deterministic server");
  }
  const runtime = project && input.runtime ? { ...input.runtime, serial: boundedText(input.runtime.serial.slice(-1600), 1600), outputs: Object.fromEntries(Object.entries(input.runtime.outputs).filter(([id]) => project.components.some((c) => c.id === id)).slice(0, 40)), problems: input.runtime.problems.slice(0, 12).map((p) => ({ ...p, message: boundedText(p.message, 500) })), provenance: "browser observation, not server proof" } : undefined;
  if (runtime) { sources.push("runtime: browser observation"); diagnostics.push(...runtime.problems); if (input.runtime!.serial.length > 1600) truncated.push("Serial"); }
  if (lesson) sources.push("learning: authored server registry");
  if (facts.evaluation) sources.push("evaluation: deterministic server, no completion write");
  if (facts.verifiedAttempt) sources.push("attempt: owned server record; compare fingerprint before using as current proof");
  const context = {
    mode: input.mode,
    learning: lesson ? { course: { id: lesson.course.id, title: lesson.course.title }, module: lesson.course.modules.find((m) => m.id === lesson.lesson.moduleId), lesson: { id: lesson.lesson.id, title: lesson.lesson.title, summary: lesson.lesson.summary, objectives: lesson.lesson.objectives, concepts: lesson.lesson.concepts, practice: lesson.lesson.practice ? { id: lesson.lesson.practice.id, goal: lesson.lesson.practice.goal } : null }, progress: facts.progress ?? "unavailable" } : undefined,
    challenge: active ? { id: active.id, version: active.version, title: active.title, objective: active.objective, hintLevel: input.hintLevel, active: true, requirements: active.requirements.map((r) => ({ id: r.id, message: r.message, hint: r.hint })), evaluation: facts.evaluation ? { passed: facts.evaluation.passed, fingerprint: facts.evaluation.fingerprint, requirements: facts.evaluation.requirements, evidence: facts.evaluation.evidence.slice(0, 12), diagnostics: facts.evaluation.diagnostics } : undefined, verifiedAttempt: facts.verifiedAttempt } : undefined,
    project: normalizedProject, circuit, code, runtime, diagnostics, selectedProblem: input.selectedProblemId ? diagnostics.find((problem) => problem.id === input.selectedProblemId) ?? null : null,
    catalog: input.mode === "project-assistant" ? catalog.map((c) => ({ type: c.key, name: c.name, support: c.support, capabilities: c.capabilities })) : undefined,
    unavailable: facts.unavailable ?? [],
  };
  if (JSON.stringify(context).length > budget && context.runtime) { context.runtime.serial = "[TRUNCATED: Serial omis untuk batas konteks]"; truncated.push("Serial"); }
  if (JSON.stringify(context).length > budget && context.code) { context.code.numbered = boundedText(context.code.numbered, 3500); context.code.truncated = true; truncated.push("code"); }
  if (JSON.stringify(context).length > budget && context.circuit) { context.circuit.nets = []; truncated.push("expanded nets; direct connections retained"); }
  if (JSON.stringify(context).length > budget) throw new RequestError("Konteks project belum muat dalam batas Cirra. Kurangi rangkaian atau ajukan pertanyaan yang lebih spesifik.", 413);
  return { context, meta: { sources, truncated: [...new Set(truncated)], challengeActive: Boolean(active), hintLevel: input.hintLevel, ...(facts.evaluation ? { fingerprint: facts.evaluation.fingerprint } : {}) } };
}
