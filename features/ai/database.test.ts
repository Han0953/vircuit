import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { beforeAll, afterAll, expect, it } from "vitest";
const db = new PGlite();
const a = "11111111-1111-4111-8111-111111111111", b = "22222222-2222-4222-8222-222222222222";
async function role(name: "authenticated" | "anon" | "service_role", owner = a) {
  await db.exec(`reset role; set role ${name}`);
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [owner]);
}
const reserve = (id: string, owner = a, minute = 2, day = 3) => db.query<{ result: string }>("select public.reserve_cirra_request($1::uuid,$2::uuid,'tutor',$3,$4,1,1000) as result", [owner, id, minute, day]);
const finish = (id: string) => db.query("select public.finish_cirra_request($1::uuid,$2::uuid,'error','FAST',10,100)", [a, id]);
beforeAll(async () => {
  await db.exec(`create role anon; create role authenticated; create role service_role; create schema auth;
    create table auth.users(id uuid primary key); insert into auth.users values('${a}'),('${b}');
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;`);
  await db.exec(readFileSync("supabase/migrations/20261007160000_cirra_usage.sql", "utf8"));
}, 30000);
afterAll(() => db.close());
it("atomically reserves, blocks duplicates/concurrency/rate limits and counts provider failure", async () => {
  await role("service_role"); const id = crypto.randomUUID();
  expect((await reserve(id)).rows[0].result).toBe("reserved");
  expect((await reserve(id)).rows[0].result).toBe("duplicate");
  expect((await reserve(crypto.randomUUID())).rows[0].result).toBe("concurrent");
  await finish(id); const second = crypto.randomUUID();
  expect((await reserve(second)).rows[0].result).toBe("reserved"); await finish(second);
  expect((await reserve(crypto.randomUUID())).rows[0].result).toBe("limited");
  await db.exec("reset role; update public.ai_usage set created_at=now()-interval '2 minutes'");
  await role("service_role"); const third = crypto.randomUUID();
  expect((await reserve(third)).rows[0].result).toBe("reserved"); await finish(third);
  expect((await reserve(crypto.randomUUID(), a, 60)).rows[0].result).toBe("limited");
  expect((await reserve(crypto.randomUUID(), b)).rows[0].result).toBe("reserved");
});
it("enforces authenticated cross-user RLS and denies client quota/write/RPC bypass", async () => {
  await role("authenticated", a); expect((await db.query("select * from public.ai_usage")).rows).toHaveLength(3);
  await expect(reserve(crypto.randomUUID(), b, 60, 1000)).rejects.toThrow("permission denied");
  await expect(finish(crypto.randomUUID())).rejects.toThrow("permission denied");
  await expect(db.query("update public.ai_usage set status='ok'")).rejects.toThrow("permission denied");
  await expect(db.query("delete from public.ai_usage")).rejects.toThrow("permission denied");
  await expect(db.query("insert into public.ai_usage(user_id,request_id,mode,lease_until) values($1,$2,'tutor',now())", [b, crypto.randomUUID()])).rejects.toThrow("permission denied");
  await role("authenticated", b); expect((await db.query<{ user_id: string }>("select * from public.ai_usage")).rows.every((r) => r.user_id === b)).toBe(true);
  await role("anon"); await expect(db.query("select * from public.ai_usage")).rejects.toThrow("permission denied");
});
it("expires abandoned requests and rejects malformed policy", async () => {
  await db.exec("reset role; update public.ai_usage set lease_until=now()-interval '1 second' where user_id='" + b + "'");
  await role("service_role"); expect((await reserve(crypto.randomUUID(), b)).rows[0].result).toBe("reserved");
  await expect(reserve(crypto.randomUUID(), a, 10000)).rejects.toThrow("Invalid request policy");
});
