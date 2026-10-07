import { describe, expect, it } from "vitest";
import { challengeCatalog, lessonChallenge } from "./registry";
import { submissionSchema } from "./contracts";
import { emptyProject } from "@/features/simulator/stores/project-store";
import { findLesson } from "@/features/learning/registry";
import { challengeStarter } from "./starter";
import { evaluateSubmission } from "./evaluate";
describe("challenge definitions", () => {
  it("links six unique versioned challenges to actual practices", () => {
    const catalog = challengeCatalog();
    expect(catalog).toHaveLength(6);
    expect(new Set(catalog.map((c) => c.id)).size).toBe(6);
    expect(lessonChallenge("lesson.tegangan-ground")).toBeUndefined();
  });
  it("rejects caller-provided verdicts, owners, and rules", () => {
    const input = { challengeId: "challenge.blink", version: 1, operationId: crypto.randomUUID(), project: emptyProject(), bindings: {} };
    expect(submissionSchema.safeParse(input).success).toBe(true);
    for (const extra of [{ passed: true }, { user_id: "spoof" }, { rules: [] }]) expect(submissionSchema.safeParse({ ...input, ...extra }).success).toBe(false);
  });
  it("never ships a fully solved challenge starter", async () => {
    for (const challenge of challengeCatalog()) {
      const project = challengeStarter(findLesson(challenge.lessonId)!.lesson);
      expect((await evaluateSubmission({ challengeId: challenge.id, version: challenge.version, project, operationId: crypto.randomUUID(), bindings: {}, projectId: null })).passed).toBe(false);
    }
  });
});
