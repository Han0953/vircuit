import "fake-indexeddb/auto";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { applyPractice } from "./practice-handoff";
import { parsePracticeCommand } from "./practice-contract";
import { findLesson } from "./registry";
import { practiceProject } from "./templates";
import { usePersistence } from "@/features/projects/store";
import { useProject } from "@/features/simulator/stores/project-store";
import { flushDraft, patchDraft, recoverDraft } from "@/features/projects/local/controller";
import { archivedDrafts, readDraft } from "@/features/projects/local/drafts";
vi.mock("@/features/simulator/worker/bridge", () => ({ resetSimulation: vi.fn() }));
beforeEach(async () => {
  const memory = new Map<string, string>();
  vi.stubGlobal("sessionStorage", { getItem: (key: string) => memory.get(key) ?? null, setItem: (key: string, value: string) => memory.set(key, value), clear: () => memory.clear() });
  const owner = crypto.randomUUID(); usePersistence.setState({ userId: owner, busy: false });
  await recoverDraft(`user:${owner}`);
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
function manifest(intent: string, owner = usePersistence.getState().userId!) {
  const lesson = findLesson("lesson.blink")!.lesson;
  vi.stubGlobal("fetch", vi.fn(async () => Response.json({ owner, context: { lessonId: lesson.id, practiceId: lesson.practice!.id, templateVersion: 1, intent }, project: practiceProject(lesson) })));
  return { lessonId: lesson.id, intent };
}
it("requires confirmation and backs up even a clean cloud-linked project", async () => {
  const owner = usePersistence.getState().userId!;
  patchDraft({ cloud: { id: crypto.randomUUID(), revision: 3, owner }, savedLocalRevision: 0 }); await flushDraft();
  const original = usePersistence.getState().draft!;
  const command = manifest(crypto.randomUUID());
  expect(await applyPractice(command)).toBe("confirm");
  expect(usePersistence.getState().draft!.id).toBe(original.id);
  expect(await applyPractice(command, true)).toBe("done");
  const backups = await archivedDrafts(original.scope);
  expect(backups).toHaveLength(1); expect(backups[0].cloud).toEqual(original.cloud);
  expect(usePersistence.getState().draft?.cloud).toBeNull();
  await recoverDraft(original.scope);
  expect(usePersistence.getState().draft?.learningContext?.intent).toBe(command.intent);
  sessionStorage.clear();
  expect(await applyPractice(command, true)).toBe("done");
  expect(await archivedDrafts(original.scope)).toHaveLength(1);
});
it("preserves edits and identity when network, validation or backup fails", async () => {
  useProject.getState().edit((p) => ({ ...p, metadata: { name: "Project penting" } })); await flushDraft();
  const original = usePersistence.getState().draft!;
  vi.stubGlobal("fetch", vi.fn(async () => Response.json({ error: "offline" }, { status: 503 })));
  const command = { lessonId: "lesson.blink", intent: crypto.randomUUID() };
  await expect(applyPractice(command, true)).rejects.toThrow();
  expect(usePersistence.getState().draft?.id).toBe(original.id);
  manifest(command.intent);
  const put = vi.spyOn(IDBObjectStore.prototype, "put");
  put.mockImplementationOnce(function () { throw new DOMException("quota", "QuotaExceededError"); });
  await expect(applyPractice(command, true)).rejects.toThrow(); put.mockRestore();
  expect((await readDraft(original.scope))?.project.metadata.name).toBe("Project penting");
  expect(usePersistence.getState().draft?.id).toBe(original.id);
});
it("rejects a different authenticated owner without changing the draft", async () => {
  const original = usePersistence.getState().draft!;
  const command = manifest(crypto.randomUUID(), crypto.randomUUID());
  await expect(applyPractice(command, true)).rejects.toThrow("Session");
  expect(usePersistence.getState().draft?.id).toBe(original.id);
});
it("uses durable draft identity when sessionStorage is unavailable", async () => {
  const command = manifest(crypto.randomUUID());
  vi.stubGlobal("sessionStorage", {
    getItem: () => { throw new DOMException("blocked", "SecurityError"); },
    setItem: () => { throw new DOMException("blocked", "SecurityError"); },
  });
  expect(await applyPractice(command, true)).toBe("done");
  expect(await applyPractice(command, true)).toBe("done");
  expect(usePersistence.getState().draft?.learningContext?.intent).toBe(command.intent);
  expect(await archivedDrafts(usePersistence.getState().draft!.scope)).toHaveLength(1);
});
it("rejects malformed or ambiguous practice intents", () => {
  expect(parsePracticeCommand("new=anything")).toBeNull();
  for (const query of ["lesson=lesson.blink", "lesson=lesson.blink&practice=bad", `lesson=lesson.blink&practice=${crypto.randomUUID()}&new=${crypto.randomUUID()}`, `lesson=lesson.blink&lesson=lesson.button&practice=${crypto.randomUUID()}`]) expect(() => parsePracticeCommand(query)).toThrow();
});
