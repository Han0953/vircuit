import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
const db = new PGlite();
let jobs = Promise.resolve();
function exclusive(task) {
  const job = jobs.catch(() => {}).then(task);
  jobs = job; return job;
}
export async function initializeProgressDatabase(owner) {
  await db.exec(`create role anon; create role authenticated; create role service_role; create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;`);
  await db.query("insert into auth.users(id) values($1)", [owner]);
  await db.exec(readFileSync("supabase/migrations/20261007050923_auth_project_persistence.sql", "utf8"));
  await db.exec(readFileSync("supabase/migrations/20261007120000_challenges_progress.sql", "utf8"));
}
export function resetProgressDatabase() {
  return exclusive(async () => { await db.exec("reset role; truncate public.learning_progress, public.challenge_attempts"); });
}
export function readProgressDatabase(owner) {
  return exclusive(async () => {
    await db.exec("reset role; set role authenticated");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [owner]);
    return (await db.query("select * from public.learning_progress order by lesson_id")).rows;
  });
}
export function writeLearningEvent(input) {
  return exclusive(async () => {
    await db.exec("reset role; set role service_role");
    return (await db.query("select public.record_learning_event($1::uuid,$2,$3,$4) as result", [input.p_user_id, input.p_course_id, input.p_lesson_id, input.p_complete])).rows[0].result;
  });
}
export function writeChallengeAttempt(input) {
  return exclusive(async () => {
    await db.exec("reset role; set role service_role");
    return (await db.query("select public.record_challenge_attempt($1::uuid,$2::uuid,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11,$12::uuid) as result", [input.p_user_id, input.p_operation_id, input.p_course_id, input.p_lesson_id, input.p_challenge_id, input.p_challenge_version, input.p_evaluator_version, input.p_engine_version, input.p_fingerprint, JSON.stringify(input.p_summary), input.p_passed, input.p_project_id])).rows[0].result;
  });
}
