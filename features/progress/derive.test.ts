import { describe, expect, it } from "vitest";
import { deriveProgress } from "./derive";
import { learningCatalog } from "@/features/learning/registry";
import type { ProgressRow } from "./contracts";
function row(id: string, status: ProgressRow["status"] = "completed", activity = "2026-10-07T00:00:00Z"): ProgressRow {
  return { user_id: "11111111-1111-4111-8111-111111111111", course_id: "course.dasar-iot", lesson_id: id, status, last_activity_at: activity, started_at: activity, completed_at: status === "completed" ? activity : null, completion_source: status === "completed" ? "challenge" : null, verified_attempt_id: null };
}
describe("real progress aggregation and continuation", () => {
  it("starts with the first lesson, derives the actual seven-lesson denominator", () => {
    const first = deriveProgress([]);
    expect(first.total).toBe(7); expect(first.completed).toBe(0);
    expect(first.continueLearning.lesson.id).toBe("lesson.tegangan-ground");
    const result = deriveProgress([row("lesson.tegangan-ground"), row("lesson.led-resistor")]);
    expect(result.completed).toBe(2); expect(result.courses[0].modules[0].completed).toBe(2);
    expect(result.skills.find((s) => s.name === "Elektronika")?.completed).toBe(2);
    expect(result.continueLearning.lesson.id).toBe("lesson.blink");
  });
  it("chooses newest in-progress, ties use authored order, and unknown content is excluded", () => {
    const data = [row("lesson.pot", "in_progress"), row("lesson.blink", "in_progress"), row("lesson.unknown")];
    expect(deriveProgress(data).continueLearning.lesson.id).toBe("lesson.blink");
    data[0].last_activity_at = "2026-10-08T00:00:00Z";
    expect(deriveProgress(data).continueLearning.lesson.id).toBe("lesson.pot");
    expect(deriveProgress(data).completed).toBe(0);
  });
  it("offers review only after every published lesson completed", () => {
    expect(deriveProgress(learningCatalog()[0].lessons.map((l) => row(l.id))).continueLearning.review).toBe(true);
  });
});
