import "fake-indexeddb/auto";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { enterLocalDemo, exitLocalDemo, isLocalDemo } from "@/features/auth/demo";
import { emptyProject } from "@/features/simulator/stores/project-store";
import { cloudRequest } from "../cloud/request";
import { listDemoProjects, loadDemoProject, saveDemoProject, renameDemoProject, deleteDemoProject } from "./demo-projects";
import { readDraft, newDraft, writeDraft } from "./drafts";

beforeEach(() => {
  const values = new Map<string, string>();
  vi.stubEnv("NODE_ENV", "development");
  vi.stubGlobal("window", {});
  vi.stubGlobal("localStorage", { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) });
  enterLocalDemo();
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
it("rejects demo activation and persistence in production even with a stored flag", async () => {
  vi.stubEnv("NODE_ENV", "production");
  expect(isLocalDemo()).toBe(false);
  expect(() => enterLocalDemo()).toThrow();
  await expect(listDemoProjects()).rejects.toThrow();
});
it("saves, reloads, renames and deletes compatible local projects without touching guest data", async () => {
  const id = crypto.randomUUID();
  const guest = newDraft("guest", emptyProject());
  await writeDraft(guest, null);
  const project = { ...emptyProject(), metadata: { name: "Demo" }, code: { language: "arduino-cpp-subset" as const, source: "void setup() {}" } };
  await saveDemoProject(id, project);
  await saveDemoProject(id, project);
  expect((await listDemoProjects()).filter((d) => d.id === id)).toHaveLength(1);
  expect((await loadDemoProject(id)).project).toEqual(project);
  await expect(renameDemoProject(id, " ")).rejects.toThrow();
  await renameDemoProject(id, "  Baru  ");
  expect((await loadDemoProject(id)).project.metadata.name).toBe("Baru");
  exitLocalDemo(); enterLocalDemo();
  expect((await loadDemoProject(id)).project.code.source).toBe(project.code.source);
  await deleteDemoProject(id);
  await expect(loadDemoProject(id)).rejects.toThrow("tidak ditemukan");
  expect((await readDraft("guest"))?.id).toBe(guest.id);
});
it("never sends cloud requests while demo is active", async () => {
  const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
  await expect(cloudRequest("/api/projects", "POST", {})).rejects.toThrow("penyimpanan lokal");
  expect(fetch).not.toHaveBeenCalled();
});
