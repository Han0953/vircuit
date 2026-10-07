import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

describe("progress migration, trusted writer and authenticated RLS", () => {
  const db = new PGlite();
  const a = "11111111-1111-4111-8111-111111111111";
  const b = "22222222-2222-4222-8222-222222222222";
  const op = crypto.randomUUID();
  async function role(name: string, owner = a) {
    await db.exec(`reset role; set role ${name}`);
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [owner]);
  }
  const event = (lesson: string, complete = false, user = a) => db.query<{ result: { status: string } }>(
    "select public.record_learning_event($1::uuid,'course.dasar-iot',$2,$3) as result", [user, lesson, complete]);
  const attempt = (passed: boolean, operation = op, fingerprint = "a".repeat(64), project: string | null = null, user = a) => db.query<{ result: { id: string; passed: boolean } }>(
    "select public.record_challenge_attempt($1::uuid,$2::uuid,'course.dasar-iot','lesson.blink','challenge.blink',1,'1','arduino-subset-1',$3,'{}'::jsonb,$4,$5::uuid) as result", [user, operation, fingerprint, passed, project]);
  beforeAll(async () => {
    await db.exec(`create role anon; create role authenticated; create role service_role; create schema auth;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      grant usage on schema auth to authenticated, anon;
      grant execute on function auth.uid() to authenticated, anon;
      insert into auth.users values('${a}'),('${b}');`);
    await db.exec(readFileSync("supabase/migrations/20261007050923_auth_project_persistence.sql", "utf8"));
    await db.exec(readFileSync("supabase/migrations/20261007120000_challenges_progress.sql", "utf8"));
  }, 30000);
  afterAll(() => db.close());
  it("starts lessons without profiles, only manually completes informational material", async () => {
    await role("service_role");
    expect((await event("lesson.tegangan-ground")).rows[0].result.status).toBe("in_progress");
    expect((await event("lesson.tegangan-ground", true)).rows[0].result.status).toBe("completed");
    expect((await event("lesson.tegangan-ground")).rows[0].result.status).toBe("completed");
    await expect(event("lesson.blink", true)).rejects.toThrow("Verified challenge required");
    await role("authenticated");
    expect((await db.query("select * from public.profiles")).rows).toHaveLength(0);
  });
  it("atomically persists, deduplicates, rejects changed operation and keeps completion monotonic", async () => {
    await role("service_role");
    const first = (await attempt(false)).rows[0].result;
    expect((await attempt(false)).rows[0].result.id).toBe(first.id);
    const replayOp = crypto.randomUUID();
    expect((await attempt(false, replayOp)).rows[0].result.id).toBe(first.id);
    await expect(attempt(true, replayOp, "b".repeat(64))).rejects.toThrow("Operation conflict");
    await expect(attempt(true, op, "b".repeat(64))).rejects.toThrow("Operation conflict");
    await attempt(true, crypto.randomUUID(), "b".repeat(64));
    await attempt(false, crypto.randomUUID(), "c".repeat(64));
    await role("authenticated");
    expect((await db.query<{ status: string }>("select status from public.learning_progress where lesson_id='lesson.blink'")).rows[0].status).toBe("completed");
    expect((await db.query("select * from public.challenge_attempts")).rows).toHaveLength(3);
  });
  it("denies anonymous/private cross-user reads and direct client completion writes/RPC", async () => {
    await role("authenticated", b);
    expect((await db.query("select * from public.learning_progress")).rows).toHaveLength(0);
    expect((await db.query("select * from public.challenge_attempts")).rows).toHaveLength(0);
    await expect(attempt(true)).rejects.toThrow("permission denied");
    await expect(event("lesson.tegangan-ground", true)).rejects.toThrow("permission denied");
    await expect(db.query("update public.learning_progress set status='completed' where user_id=$1", [a])).rejects.toThrow("permission denied");
    await expect(db.query("delete from public.challenge_attempts")).rejects.toThrow("permission denied");
    await expect(db.query("insert into public.learning_progress(user_id,course_id,lesson_id,status) values($1,'c','l','in_progress')", [b])).rejects.toThrow("permission denied");
    await role("anon");
    await expect(db.query("select * from public.learning_progress")).rejects.toThrow("permission denied");
    await expect(db.query("select * from public.challenge_attempts")).rejects.toThrow("permission denied");
  });
  it("checks project ownership and rolls back invalid writes", async () => {
    await role("service_role");
    await expect(attempt(true, crypto.randomUUID(), "d".repeat(64), crypto.randomUUID())).rejects.toThrow("Project not found");
    await expect(attempt(true, crypto.randomUUID(), "invalid")).rejects.toThrow();
    await role("authenticated");
    expect((await db.query("select * from public.challenge_attempts")).rows).toHaveLength(3);
  });
});
