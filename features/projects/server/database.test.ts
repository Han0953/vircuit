import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { emptyProject } from "../../simulator/stores/project-store";

describe("PostgreSQL migration / real authenticated RLS contexts", () => {
  const db = new PGlite();
  const a = "11111111-1111-4111-8111-111111111111";
  const b = "22222222-2222-4222-8222-222222222222";
  let projectId: string;
  const draftId = crypto.randomUUID();
  const operation = crypto.randomUUID();
  const payload = emptyProject();
  async function user(id: string) {
    await db.exec("reset role; set role authenticated");
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id]);
  }
  const save = (id: string | null, expected: number, op = crypto.randomUUID(), snapshot = payload) => db.query<{ result: { id: string; revision: number } }>(
    "select public.save_project($1::uuid,$2::uuid,$3::integer,$4::uuid,$5::jsonb) as result", [id, draftId, expected, op, JSON.stringify(snapshot)]);
  beforeAll(async () => {
    await db.exec(`create role anon; create role authenticated; create schema auth;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
      grant usage on schema auth to authenticated, anon; grant execute on function auth.uid() to authenticated, anon;
      insert into auth.users values('${a}'),('${b}');`);
    await db.exec(readFileSync("supabase/migrations/20261007050923_auth_project_persistence.sql", "utf8"));
  }, 30000);
  afterAll(() => db.close());
  it("atomically creates and replays one save without duplicate snapshots", async () => {
    await user(a);
    const first = (await save(null, 0, operation)).rows[0].result;
    projectId = first.id;
    expect(first.revision).toBe(1);
    expect((await save(null, 0, operation)).rows[0].result).toEqual(first);
    expect((await db.query("select * from public.project_snapshots")).rows).toHaveLength(1);
    await expect(save(projectId, 0)).rejects.toThrow("Revision conflict");
    expect((await save(projectId, 1)).rows[0].result.revision).toBe(2);
  });
  it("isolates User B from all User A rows and mutations", async () => {
    await user(b);
    expect((await db.query("select * from public.projects")).rows).toHaveLength(0);
    expect((await db.query("select * from public.project_snapshots")).rows).toHaveLength(0);
    expect((await db.query("select * from public.profiles")).rows).toHaveLength(0);
    await expect(save(projectId, 2)).rejects.toThrow("Project not found");
    await expect(db.query("select public.delete_project($1,2)", [projectId])).rejects.toThrow("Project not found");
    await expect(db.query("update public.projects set user_id=$1 where id=$2", [b, projectId])).rejects.toThrow("permission denied");
    await expect(db.query("insert into public.profiles(id) values($1)", [b])).rejects.toThrow("permission denied");
    await expect(db.query("delete from public.project_snapshots where project_id=$1", [projectId])).rejects.toThrow("permission denied");
  });
  it("denies anonymous reads/writes, invalid payload and stale delete", async () => {
    await db.exec("reset role; set role anon");
    await expect(save(null, 0)).rejects.toThrow("permission denied");
    await expect(db.query("select * from public.projects")).rejects.toThrow("permission denied");
    await user(a);
    await expect(save(projectId, 2, crypto.randomUUID(), { ...payload, schemaVersion: 2 } as unknown as typeof payload)).rejects.toThrow("Invalid project");
    await expect(save(projectId, 2, crypto.randomUUID(), { ...payload, code: {} } as unknown as typeof payload)).rejects.toThrow("Invalid project");
    await expect(save(projectId, 2, crypto.randomUUID(), { ...payload, viewport: { x: 0, y: 0, zoom: 99 } })).rejects.toThrow("Invalid viewport");
    await expect(db.query("select public.delete_project($1,1)", [projectId])).rejects.toThrow("Revision conflict");
    await db.query("select public.delete_project($1,2)", [projectId]);
    expect((await db.query("select * from public.project_snapshots")).rows).toHaveLength(0);
  });
});
