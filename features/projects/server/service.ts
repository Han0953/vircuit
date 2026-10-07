import { z } from "zod";
import { serverClient } from "@/lib/supabase/server";
import { RequestError, limitedJson, requireSameOrigin } from "@/lib/request-security";
import { loadResultSchema, projectListSchema, projectQuerySchema, saveRequestSchema, saveResultSchema, titleSchema, type SaveRequest } from "../contracts";

export async function authenticatedClient(readOnly = false) {
  const client = await serverClient(readOnly);
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) throw new RequestError("Masuk untuk menggunakan penyimpanan akun.", 401);
  return { client, user };
}
export async function listProjectPage(query: unknown, readOnly = false, pageSize = 24) {
  const { client, user } = await authenticatedClient(readOnly);
  const parsed = projectQuerySchema.safeParse(query);
  if (!parsed.success) throw new RequestError("Pencarian atau halaman tidak valid.", 400);
  const { page, search } = parsed.data;
  const offset = (page - 1) * pageSize;
  let request = client.from("projects").select("id,title,revision,updated_at").eq("user_id", user.id)
    .order("updated_at", { ascending: false }).order("id", { ascending: false });
  if (search) request = request.ilike("title", `%${search.replace(/[\\%_]/g, "\\$&")}%`);
  const { data, error } = await request.range(offset, offset + pageSize);
  databaseError(error);
  const items = projectListSchema.parse(data);
  return { items: items.slice(0, pageSize), page, hasMore: items.length > pageSize };
}
export function databaseError(error: { code?: string } | null) {
  if (!error) return;
  if (error.code === "40001") throw new RequestError("Revision berbeda. Perubahan lokal tetap disimpan. Buka versi cloud atau simpan sebagai proyek baru.", 409);
  if (error.code === "42501") throw new RequestError("Proyek tidak ditemukan atau akses ditolak.", 404);
  if (error.code === "22023") throw new RequestError("Snapshot tidak valid.", 400);
  throw new RequestError("Penyimpanan cloud belum dapat diakses. Draft lokal tetap tersedia.", 503);
}
export async function saveSnapshot(client: Awaited<ReturnType<typeof serverClient>>, input: SaveRequest) {
  const { data, error } = await client.rpc("save_project", { p_project_id: input.id, p_draft_id: input.draftId, p_operation_id: input.operationId, p_expected_revision: input.expectedRevision, p_payload: input.payload });
  databaseError(error);
  return saveResultSchema.parse(data);
}
export async function listProjects() {
  const { client, user } = await authenticatedClient();
  const { data, error } = await client.from("projects").select("id,title,revision,updated_at").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(100);
  databaseError(error); return projectListSchema.parse(data);
}
export async function saveProject(request: Request) {
  requireSameOrigin(request);
  const { client } = await authenticatedClient();
  const input = saveRequestSchema.safeParse(await limitedJson(request, 2_000_000));
  if (!input.success) throw new RequestError("Snapshot, ID, judul, atau revision tidak valid.", 400);
  return saveSnapshot(client, input.data);
}
export async function loadProject(id: string) {
  if (!z.uuid().safeParse(id).success) throw new RequestError("ID proyek tidak valid.", 400);
  const { client, user } = await authenticatedClient();
  const { data: project, error } = await client.from("projects").select("id,revision").eq("id", id).eq("user_id", user.id).maybeSingle();
  databaseError(error); if (!project) throw new RequestError("Proyek tidak ditemukan.", 404);
  const { data: snapshot, error: snapshotError } = await client.from("project_snapshots").select("payload,schema_version").eq("project_id", id).eq("revision", project.revision).maybeSingle();
  databaseError(snapshotError);
  if (!snapshot || snapshot.schema_version !== 1) throw new RequestError("Snapshot tidak didukung. Proyek aktif tidak diubah.", 422);
  const parsed = loadResultSchema.safeParse({ ...project, payload: snapshot.payload });
  if (!parsed.success) throw new RequestError("Snapshot cloud tidak valid. Proyek aktif tidak diubah.", 422);
  return parsed.data;
}
export async function deleteProject(request: Request, id: string) {
  requireSameOrigin(request);
  if (!z.uuid().safeParse(id).success) throw new RequestError("ID proyek tidak valid.", 400);
  const { client } = await authenticatedClient();
  const input = z.object({ expectedRevision: z.number().int().positive() }).strict().safeParse(await limitedJson(request, 1024));
  if (!input.success) throw new RequestError("Revision tidak valid.", 400);
  const { error } = await client.rpc("delete_project", { p_project_id: id, p_expected_revision: input.data.expectedRevision });
  databaseError(error); return { ok: true };
}
export async function renameProject(request: Request, id: string) {
  requireSameOrigin(request);
  const input = z.object({ title: titleSchema, expectedRevision: z.number().int().positive(), operationId: z.uuid(), draftId: z.uuid() }).strict().safeParse(await limitedJson(request, 2048));
  if (!input.success) throw new RequestError("Judul atau revision tidak valid.", 400);
  const loaded = await loadProject(id);
  const { client } = await authenticatedClient();
  return saveSnapshot(client, { id, draftId: input.data.draftId, expectedRevision: input.data.expectedRevision, operationId: input.data.operationId, payload: { ...loaded.payload, metadata: { name: input.data.title } } });
}
