import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
describe("settings profile RPC / PostgreSQL ownership", () => {
  const db = new PGlite();
  const a = "11111111-1111-4111-8111-111111111111", b = "22222222-2222-4222-8222-222222222222";
  async function asUser(id: string) { await db.exec("reset role; set role authenticated"); await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]); }
  beforeAll(async () => {
    await db.exec(`create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$; grant usage on schema auth to authenticated,anon; grant execute on function auth.uid() to authenticated,anon;`);
    await db.query("insert into auth.users values($1),($2)", [a, b]);
    await db.exec(readFileSync("supabase/migrations/20261007050923_auth_project_persistence.sql", "utf8"));
    await db.exec(readFileSync("supabase/pending/settings_profile.sql", "utf8"));
  }, 30000);
  afterAll(() => db.close());
  it("creates/updates own profile while keeping direct writes and cross-user reads denied", async () => {
    await asUser(a); await db.query("select public.update_my_profile($1)", ["  Nadia  "]);
    expect((await db.query("select display_name from public.profiles")).rows).toEqual([{ display_name: "Nadia" }]);
    await asUser(b); expect((await db.query("select * from public.profiles")).rows).toEqual([]);
    await db.query("select public.update_my_profile($1)", ["Bima"]);
    await expect(db.query("update public.profiles set display_name='Forged' where id=$1", [a])).rejects.toThrow("permission denied");
    await expect(db.query("delete from public.profiles where id=$1", [a])).rejects.toThrow("permission denied");
    await asUser(a); expect((await db.query("select display_name from public.profiles")).rows).toEqual([{ display_name: "Nadia" }]);
    await db.query("select public.update_my_profile($1)", ["Nadia Baru"]);
    expect((await db.query("select display_name from public.profiles")).rows).toEqual([{ display_name: "Nadia Baru" }]);
  });
  it("rejects invalid names, missing identity and anonymous RPC execution", async () => {
    await asUser(a); await expect(db.query("select public.update_my_profile($1)", ["<script>"])).rejects.toThrow("Invalid display name");
    await asUser(""); await expect(db.query("select public.update_my_profile('Valid')")).rejects.toThrow("Authentication required");
    await db.exec("reset role; set role anon"); await expect(db.query("select public.update_my_profile('Valid')")).rejects.toThrow("permission denied");
  });
});
