import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { beforeAll, afterAll, it, expect } from "vitest";
const db = new PGlite();
const a="11111111-1111-4111-8111-111111111111", b="22222222-2222-4222-8222-222222222222";
async function asUser(id:string) { await db.exec("reset role; set role authenticated"); await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]); }
beforeAll(async () => {
  await db.exec(`create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
  grant usage on schema auth to authenticated,anon; grant execute on function auth.uid() to authenticated,anon;
  create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]); create table storage.objects(id int generated always as identity,bucket_id text,name text); alter table storage.objects enable row level security;
  grant usage on schema storage to authenticated,anon; grant all on storage.objects to authenticated; grant usage on sequence storage.objects_id_seq to authenticated;`);
  await db.query("insert into auth.users values($1),($2)",[a,b]);
  await db.exec(readFileSync("supabase/migrations/20261014054612_settings_avatar_storage.sql","utf8"));
},30000);
afterAll(()=>db.close());
it("owns exact avatar path, denies cross-user writes/reads and revoked account tokens",async()=>{
  await asUser(a); await db.query("insert into storage.objects(bucket_id,name) values('profile-avatars',$1)",[`${a}/avatar.webp`]);
  await asUser(b); expect((await db.query("select * from storage.objects")).rows).toEqual([]);
  await expect(db.query("insert into storage.objects(bucket_id,name) values('profile-avatars',$1)",[`${a}/avatar.webp`])).rejects.toThrow("row-level security");
  expect((await db.query("delete from storage.objects where name=$1 returning id",[`${a}/avatar.webp`])).rows).toEqual([]);
  await expect(db.query("insert into storage.objects(bucket_id,name) values('profile-avatars',$1)",[`${b}/other.webp`])).rejects.toThrow("row-level security");
  await asUser(a); await expect(db.query("update storage.objects set name=$1",[`${b}/avatar.webp`])).rejects.toThrow("row-level security");
  await db.exec("reset role"); await db.query("delete from auth.users where id=$1",[a]);
  await asUser(a); expect((await db.query("select * from storage.objects")).rows).toEqual([]);
  await expect(db.query("insert into storage.objects(bucket_id,name) values('profile-avatars',$1)",[`${a}/avatar.webp`])).rejects.toThrow("row-level security");
});
