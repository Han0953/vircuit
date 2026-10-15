import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const names = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "SUPABASE_SECRET_KEY", "RLS_USER_A_EMAIL", "RLS_USER_A_PASSWORD", "RLS_USER_B_EMAIL", "RLS_USER_B_PASSWORD"];
if (names.some((name) => !process.env[name])) { console.log("Remote progress: NOT VERIFIED (test configuration missing)"); process.exit(2); }
const make = (key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { fetch: (url, init) => fetch(url, { ...init, signal: AbortSignal.timeout(20000) }) },
});
const a = make(), b = make(), anon = make(), setup = make(process.env.SUPABASE_SECRET_KEY);
const lesson = `lesson.verification-${randomUUID()}`;
const owners = [];
let assertions = 0;
const check = (condition, label) => { if (!condition) throw new Error(label); console.log(`Remote progress assertion ${++assertions}: PASS`); };
try {
  for (const [client, prefix] of [[a, "A"], [b, "B"]]) {
    const result = await client.auth.signInWithPassword({ email: process.env[`RLS_USER_${prefix}_EMAIL`], password: process.env[`RLS_USER_${prefix}_PASSWORD`] });
    check(!result.error && !!result.data.user, "Test account login failed");
    owners.push(result.data.user.id);
  }
  check(owners[0] !== owners[1], "Test accounts must differ");
  // The privileged client only seeds/cleans unique synthetic records. Every
  // isolation/denial assertion below uses real A/B JWTs or the public client.
  for (const owner of owners) {
    const result = await setup.rpc("record_challenge_attempt", {
      p_user_id: owner, p_operation_id: randomUUID(), p_course_id: "course.verification", p_lesson_id: lesson,
      p_challenge_id: "challenge.verification", p_challenge_version: 1, p_evaluator_version: "verification", p_engine_version: "verification",
      p_fingerprint: randomUUID().replaceAll("-", "").repeat(2), p_summary: {}, p_passed: false, p_project_id: null,
    });
    check(!result.error && result.data?.passed === false, "Synthetic unpassed attempt setup failed");
  }
  for (const [client, own, other] of [[a, owners[0], owners[1]], [b, owners[1], owners[0]]]) {
    for (const table of ["learning_progress", "challenge_attempts"]) {
      const mine = await client.from(table).select("user_id").eq("lesson_id", lesson).eq("user_id", own);
      check(!mine.error && mine.data.length === 1, "Own progress/attempt read failed");
      const cross = await client.from(table).select("user_id").eq("lesson_id", lesson).eq("user_id", other);
      check(!cross.error && cross.data.length === 0, "Cross-account data leaked");
      const update = await client.from(table).update({ user_id: other }).eq("lesson_id", lesson).eq("user_id", own);
      check(update.error?.code === "42501", "Direct ownership update was permitted");
      const remove = await client.from(table).delete().eq("lesson_id", lesson).eq("user_id", other);
      check(remove.error?.code === "42501", "Direct cross-account deletion was permitted");
    }
    const spoof = await client.rpc("record_learning_event", { p_user_id: other, p_course_id: "course.verification", p_lesson_id: lesson, p_complete: false });
    check(spoof.error?.code === "42501", "Client called trusted progress writer");
  }
  for (const table of ["learning_progress", "challenge_attempts"]) {
    check((await anon.from(table).select("user_id").eq("lesson_id", lesson)).error?.code === "42501", "Anonymous progress read permitted");
  }
} finally {
  if (owners.length) {
    const progress = await setup.from("learning_progress").delete().eq("lesson_id", lesson).in("user_id", owners);
    const attempts = await setup.from("challenge_attempts").delete().eq("lesson_id", lesson).in("user_id", owners);
    if (progress.error || attempts.error) throw new Error("Synthetic progress cleanup failed");
  }
  await Promise.all([a.auth.signOut({ scope: "local" }), b.auth.signOut({ scope: "local" })]);
}
console.log(`Remote progress: PASS (${assertions} assertions; synthetic records cleaned)`);
