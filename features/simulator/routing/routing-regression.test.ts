import { expect, it } from "vitest";
import { evaluateSubmission } from "../../challenges/evaluate";
import { buildContext } from "../../ai/context";
import { requestSchema } from "../../ai/contracts";
import { findLesson } from "../../learning/registry";
import { practiceProject } from "../../learning/templates";
import { buildRoutingScene, wireInput } from "./routing-scene";
import { routeWire } from "./orthogonal-router";
import { serializeProject } from "../schemas/project-schema";

it("leaves deterministic challenge fingerprint, completion result and Cirra electrical context unchanged", async () => {
  const project = practiceProject(findLesson("lesson.blink")!.lesson);
  const submission = { project, challengeId: "challenge.blink", version: 1, operationId: "b1bba135-6ebd-4f9f-b601-c91290b01bd1", bindings: {}, projectId: null };
  const before = serializeProject(project);
  const evaluation = await evaluateSubmission(submission);
  const request = requestSchema.parse({ requestId: "b1bba135-6ebd-4f9f-b601-c91290b01bd1", mode: "debugger", message: "Periksa wiring", project, lessonId: "lesson.blink", challengeId: "challenge.blink" });
  const context = buildContext(request);
  const scene = buildRoutingScene(project.components, project.wires);
  for (const wire of project.wires) routeWire(wireInput(scene, wire)!);
  expect(serializeProject(project)).toBe(before);
  expect(await evaluateSubmission(submission)).toEqual(evaluation);
  expect(buildContext(request)).toEqual(context);
});
