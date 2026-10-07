import { beforeEach, describe, expect, it, vi } from "vitest";
import { emptyProject } from "../../simulator/stores/project-store";
const { client } = vi.hoisted(() => ({ client: { auth: { getUser: vi.fn() }, rpc: vi.fn(), from: vi.fn() } }));
vi.mock("@/lib/supabase/server", () => ({ serverClient: async () => client }));
import { deleteProject, listProjectPage, loadProject, renameProject, saveProject } from "./service";
const id = "11111111-1111-4111-8111-111111111111";
const input = () => ({ id: null, draftId: crypto.randomUUID(), operationId: crypto.randomUUID(), expectedRevision: 0, payload: emptyProject() });
const request = (body: unknown, method = "POST") => new Request("https://vircuit.test/api/projects", { method, headers: { "Content-Type": "application/json", origin: "https://vircuit.test" }, body: JSON.stringify(body) });
describe("cloud API authorization / validation", () => {
  beforeEach(() => { vi.resetAllMocks(); client.auth.getUser.mockResolvedValue({ data: { user: { id } }, error: null }); });
  it("paginates beyond 100 with owner filtering, deterministic sorting and literal title search", async () => {
    const items = Array.from({ length: 25 }, (_, index) => ({ id: crypto.randomUUID(), title: `Project ${index}`, revision: 1, updated_at: new Date().toISOString() }));
    const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), ilike: vi.fn().mockReturnThis(), range: vi.fn().mockResolvedValue({ data: items, error: null }) };
    client.from.mockReturnValue(query);
    const result = await listProjectPage({ page: 6, search: "LED_100%" }, true);
    expect(result.items).toHaveLength(24); expect(result.hasMore).toBe(true);
    expect(query.eq).toHaveBeenCalledWith("user_id", id);
    expect(query.order).toHaveBeenCalledWith("updated_at", { ascending: false });
    expect(query.order).toHaveBeenCalledWith("id", { ascending: false });
    expect(query.range).toHaveBeenCalledWith(120, 144);
    expect(query.ilike).toHaveBeenCalledWith("title", "%LED\\_100\\%%");
    await expect(listProjectPage({ page: -1 })).rejects.toMatchObject({ status: 400 });
  });
  it("rename validates title and sends a versioned snapshot with expected revision", async () => {
    const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValueOnce({ data: { id, revision: 2 }, error: null }).mockResolvedValueOnce({ data: { schema_version: 1, payload: emptyProject() }, error: null }) };
    client.from.mockReturnValue(query); client.rpc.mockResolvedValue({ data: { id, revision: 3 }, error: null });
    const input = { title: "  Renamed  ", expectedRevision: 2, operationId: crypto.randomUUID(), draftId: crypto.randomUUID() };
    expect(await renameProject(request(input, "PATCH"), id)).toEqual({ id, revision: 3 });
    expect(client.rpc.mock.calls[0][1]).toMatchObject({ p_expected_revision: 2, p_payload: { metadata: { name: "Renamed" } } });
    await expect(renameProject(request({ ...input, title: " " }, "PATCH"), id)).rejects.toMatchObject({ status: 400 });
  });
  it("requires server verified user", async () => {
    client.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(saveProject(request(input()))).rejects.toMatchObject({ status: 401 });
    expect(client.rpc).not.toHaveBeenCalled();
  });
  it("rejects ownership spoof and malformed snapshots", async () => {
    await expect(saveProject(request({ ...input(), user_id: id }))).rejects.toMatchObject({ status: 400 });
    await expect(saveProject(request({ ...input(), payload: { schemaVersion: 2 } }))).rejects.toMatchObject({ status: 400 });
    expect(client.rpc).not.toHaveBeenCalled();
  });
  it("saves validated snapshot without accepting owner parameters", async () => {
    client.rpc.mockResolvedValue({ data: { id, revision: 1 }, error: null });
    expect(await saveProject(request(input()))).toEqual({ id, revision: 1 });
    expect(client.rpc.mock.calls[0][1]).not.toHaveProperty("user_id");
  });
  it("returns conflict and rejects foreign delete", async () => {
    client.rpc.mockResolvedValue({ data: null, error: { code: "40001" } });
    await expect(saveProject(request(input()))).rejects.toMatchObject({ status: 409 });
    client.rpc.mockResolvedValue({ error: { code: "42501" } });
    await expect(deleteProject(request({ expectedRevision: 1 }, "DELETE"), id)).rejects.toMatchObject({ status: 404 });
  });
  it("filters load by verified ownership", async () => {
    const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) };
    client.from.mockReturnValue(query);
    await expect(loadProject(id)).rejects.toMatchObject({ status: 404 });
    expect(query.eq).toHaveBeenCalledWith("user_id", id);
  });
});
