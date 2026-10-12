import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const required = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "RLS_USER_A_EMAIL", "RLS_USER_A_PASSWORD", "RLS_USER_B_EMAIL", "RLS_USER_B_PASSWORD"];
if (required.some((name) => !process.env[name])) {
  console.log("Remote RLS: NOT VERIFIED (konfigurasi dua akun test belum tersedia).");
  process.exit(2);
}
const client = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { fetch: (url, init) => fetch(url, { ...init, signal: AbortSignal.timeout(20000) }) },
});
const a = client(), b = client(), anon = client();
const check = (condition, label) => { if (!condition) throw new Error(label); console.log(`Remote assertion ${++assertions}: PASS`); };
let assertions = 0;
let id; let idB; let cleanupRevision = 1; let verified = false;
try {
  const authA = await a.auth.signInWithPassword({ email: process.env.RLS_USER_A_EMAIL, password: process.env.RLS_USER_A_PASSWORD });
  const authB = await b.auth.signInWithPassword({ email: process.env.RLS_USER_B_EMAIL, password: process.env.RLS_USER_B_PASSWORD });
  check(!authA.error && !authB.error && authA.data.user?.id !== authB.data.user?.id, "Dua test session tidak valid atau sama.");
  const payload = { schemaVersion: 1, metadata: { name: "RLS isolated verification" }, components: [], wires: [], viewport: { x: 0, y: 0, zoom: 1 }, code: { language: "arduino-cpp-subset", source: "void setup(){}void loop(){}" }, settings: { boardId: null } };
  const args = { p_project_id: null, p_draft_id: randomUUID(), p_expected_revision: 0, p_operation_id: randomUUID(), p_payload: payload };
  const created = await a.rpc("save_project", args); check(!created.error && created.data?.id && created.data.revision === 1, "Owner create gagal."); id = created.data.id;
  const replay = await a.rpc("save_project", args); check(!replay.error && replay.data.id === id && replay.data.revision === 1, "Replay tidak idempotent.");
  const readB = await b.from("projects").select("id").eq("id", id); check(!readB.error && readB.data.length === 0, "Cross-user SELECT proyek gagal diisolasi.");
  const snapshotsB = await b.from("project_snapshots").select("id").eq("project_id", id); check(!snapshotsB.error && snapshotsB.data.length === 0, "Cross-user SELECT snapshot gagal diisolasi.");
  check((await b.rpc("save_project", { ...args, p_project_id: id, p_expected_revision: 1, p_operation_id: randomUUID() })).error?.code === "42501", "Cross-user save diterima.");
  check((await b.rpc("delete_project", { p_project_id: id, p_expected_revision: 1 })).error?.code === "42501", "Cross-user delete diterima.");
  check((await b.from("projects").update({ user_id: authB.data.user.id }).eq("id", id)).error?.code === "42501", "Ownership escalation diterima.");
  check((await anon.rpc("save_project", args)).error?.code === "42501", "Anonymous save diterima.");
  const anonymousRead = await anon.from("projects").select("id").eq("id", id); check(anonymousRead.error?.code === "42501" || (!anonymousRead.error && anonymousRead.data.length === 0), "Anonymous SELECT bocor atau tidak terverifikasi.");
  const ownerRead = await a.from("project_snapshots").select("id").eq("project_id", id); check(!ownerRead.error && ownerRead.data.length === 1, "Snapshot owner/replay salah.");
  check((await a.rpc("save_project", { ...args, p_project_id: id, p_expected_revision: 0, p_operation_id: randomUUID() })).error?.code === "PT409", "Stale save diterima.");
  const updated = await a.rpc("save_project", { ...args, p_project_id: id, p_expected_revision: 1, p_operation_id: randomUUID(), p_payload: { ...payload, metadata: { name: "Updated isolated verification" } } });
  check(!updated.error && updated.data.revision === 2, "Owner update gagal."); cleanupRevision = 2;
  check((await a.rpc("delete_project", { p_project_id: id, p_expected_revision: 1 })).error?.code === "PT409", "Stale delete tidak mengembalikan konflik yang tepat.");
  const createdB = await b.rpc("save_project", { ...args, p_draft_id: randomUUID(), p_operation_id: randomUUID() });
  check(!createdB.error && createdB.data?.id, "Owner B create gagal."); idB = createdB.data.id;
  const readA = await a.from("projects").select("id").eq("id", idB);
  check(!readA.error && readA.data.length === 0, "User A dapat membaca proyek B.");
  const snapshotsA = await a.from("project_snapshots").select("id").eq("project_id", idB);
  check(!snapshotsA.error && snapshotsA.data.length === 0, "User A dapat membaca snapshot B.");
  check((await a.rpc("save_project", { ...args, p_project_id: idB, p_expected_revision: 1, p_operation_id: randomUUID() })).error?.code === "42501", "User A dapat mengubah proyek B.");
  check((await a.rpc("delete_project", { p_project_id: idB, p_expected_revision: 1 })).error?.code === "42501", "User A dapat menghapus proyek B.");
  check((await a.rpc("save_project", { ...args, p_draft_id: randomUUID(), p_operation_id: randomUUID(), p_payload: { ...payload, schemaVersion: 999 } })).error?.code === "22023", "Unsupported snapshot diterima.");
  verified = true;
} catch (error) {
  console.error(`Remote RLS: FAIL (${error instanceof Error ? error.message : "verification gagal"}).`); process.exitCode = 1;
} finally {
  if (id) { const removed = await a.rpc("delete_project", { p_project_id: id, p_expected_revision: cleanupRevision }); if (removed.error) { console.error("Proyek test belum dapat dibersihkan; hapus melalui akun test owner."); verified = false; process.exitCode = 1; } }
  if (idB) { const removed = await b.rpc("delete_project", { p_project_id: idB, p_expected_revision: 1 }); if (removed.error) { console.error("Proyek test B belum dapat dibersihkan."); verified = false; process.exitCode = 1; } }
  await Promise.all([a.auth.signOut({ scope: "local" }), b.auth.signOut({ scope: "local" })]);
}
if (verified) console.log("Remote RLS: PASS (dua authenticated contexts dan anon; tanpa service role).");
