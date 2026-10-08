import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { initializeProgressDatabase, resetProgressDatabase, readProgressDatabase, writeLearningEvent, writeChallengeAttempt } from "./progress-db.mjs";

export const owner = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const user = { id: owner, email: "dashboard@example.test", aud: "authenticated", role: "authenticated", app_metadata: {}, user_metadata: {}, created_at: "2026-01-01T00:00:00Z" };
const token = [Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url"), Buffer.from(JSON.stringify({ sub: owner, aud: "authenticated", role: "authenticated", exp: 2000000000 })).toString("base64url"), Buffer.alloc(32, 1).toString("base64url")].join(".");
const blank = (name) => ({ schemaVersion: 1, metadata: { name }, components: [], wires: [], code: { language: "arduino-cpp-subset", source: "void setup() {}\nvoid loop() {}" }, viewport: { x: 0, y: 0, zoom: 1 }, settings: { boardId: null } });
let rows = [];
let failure = false;
let conflict = false;
let saves = 0;
let active = true;
function reset(count = 28) {
  rows = Array.from({ length: count }, (_, index) => {
    const id = `bbbbbbbb-bbbb-4bbb-8bbb-${String(index + 1).padStart(12, "0")}`;
    const title = `Proyek ${String(index + 1).padStart(3, "0")}`;
    return { id, title, revision: 1, user_id: owner, updated_at: new Date(Date.now() - (index + 1) * 60000).toISOString(), payload: blank(title), operations: new Map() };
  });
  failure = false; conflict = false; saves = 0; active = true;
}
reset();
export async function startSupabaseFixture() {
  await initializeProgressDatabase(owner);
  const server = createServer(async (request, response) => {
    const url = new URL(request.url, "http://127.0.0.1:3031");
    const send = (data, status = 200) => { response.writeHead(status, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "http://localhost:3002", "Access-Control-Allow-Headers": "*" }); response.end(JSON.stringify(data)); };
    const chunks = []; for await (const chunk of request) chunks.push(chunk);
    const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : {};
    const equal = (key) => url.searchParams.get(key)?.replace(/^eq\./, "");
    if (request.method === "OPTIONS") return send({});
    if (url.pathname === "/__fixture/gemini") {
      if (request.headers["x-goog-api-key"] !== "local-playwright-fixture") return send({ error: { code: 403, message: "Fixture key required" } }, 403);
      const data = JSON.parse(body.contents[0].parts[0].text);
      if (data.userMessage.includes("fixture-slow")) await new Promise((resolve) => setTimeout(resolve, 2000));
      const mode = data.untrustedContext.mode;
      const result = { mode, answer: mode === "tutor" ? "Aku bantu kamu memahami resistor: resistor membatasi arus untuk LED." : mode === "debugger" ? "Aku memeriksa wiring dan kode aktual kamu. Periksa kecocokan pin output dan jalur GND." : "Aku bantu kamu merencanakan project berdasarkan komponen yang didukung.", observations: mode === "debugger" ? ["Koneksi dan kode diambil dari draft saat pesan dikirim."] : [], suggestions: ["Periksa satu langkah, lalu uji lagi."], hints: data.untrustedContext.challenge ? ["Mulai dari pin dan jalur ground sebelum mengubah kode."] : [], references: [] };
      if (mode === "project-assistant") result.blueprint = { goal: "Rencana project", constraints: ["Dukungan simulator masih subset."], components: [{ name: "Arduino Uno", catalogType: "uno", support: "partial" }], circuitPlan: ["Rencanakan koneksi input dan output."], programStructure: ["Baca input lalu kendalikan output."], testing: ["Uji rangkaian secara bertahap."] };
      return send({ candidates: [{ content: { role: "model", parts: [{ text: JSON.stringify(result) }] }, finishReason: "STOP" }], usageMetadata: { totalTokenCount: 30 } });
    }
    if (url.pathname === "/__fixture/reset") { reset(body.count); await resetProgressDatabase(); failure = !!body.failure; return send({ ok: true }); }
    if (url.pathname === "/__fixture/state") return send({ saves, count: rows.length, rows: rows.map(({ id, title, revision }) => ({ id, title, revision })) });
    if (url.pathname === "/__fixture/conflict") { conflict = !!body.enabled; return send({ ok: true }); }
    if (url.pathname === "/auth/v1/token") { active = true; return send({ access_token: token, refresh_token: "fixture-refresh", token_type: "bearer", expires_in: 3600, expires_at: 2000000000, user }); }
    const authenticated = active && request.headers.authorization === `Bearer ${token}`;
    if (url.pathname === "/auth/v1/user") return authenticated ? send(user) : send({ message: "Invalid session" }, 401);
    if (url.pathname === "/auth/v1/logout") { active = false; return send({}); }
    if (url.pathname === "/rest/v1/rpc/record_learning_event" || url.pathname === "/rest/v1/rpc/record_challenge_attempt") {
      // This marker is accepted only by this loopback fixture, never a cloud credential.
      if (request.headers.apikey !== "sb_secret_local_playwright_fixture" || !active) return send({ code: "42501" }, 403);
      if (failure) return send({ code: "503", message: "Fixture unavailable" }, 503);
      try { return send(await (url.pathname.endsWith("record_learning_event") ? writeLearningEvent(body) : writeChallengeAttempt(body))); }
      catch (error) { return send({ code: error.code ?? "503", message: "Local progress DB rejected input" }, 400); }
    }
    if (!authenticated) return send({ code: "42501", message: "Access denied" }, 403);
    if (url.pathname === "/rest/v1/profiles") return send(request.headers.accept?.includes("object") ? { display_name: "Astra" } : [{ display_name: "Astra" }]);
    if (failure) return send({ code: "503", message: "Fixture unavailable" }, 503);
    if (url.pathname === "/rest/v1/learning_progress") return send(await readProgressDatabase(owner));
    if (url.pathname === "/rest/v1/projects") {
      let selected = rows.filter((item) => (!equal("user_id") || equal("user_id") === item.user_id) && (!equal("id") || equal("id") === item.id));
      const pattern = url.searchParams.get("title");
      if (pattern) { const search = pattern.replace(/^ilike\.%/, "").replace(/%$/, "").replace(/\\([%_\\])/g, "$1").toLowerCase(); selected = selected.filter((item) => item.title.toLowerCase().includes(search)); }
      selected.sort((a, b) => b.updated_at.localeCompare(a.updated_at) || b.id.localeCompare(a.id));
      const offset = Number(url.searchParams.get("offset") ?? 0); const limit = Number(url.searchParams.get("limit") ?? 100);
      const result = selected.slice(offset, offset + limit).map(({ id, title, revision, updated_at }) => ({ id, title, revision, updated_at }));
      return send(request.headers.accept?.includes("object") ? result[0] ?? null : result);
    }
    if (url.pathname === "/rest/v1/project_snapshots") {
      const row = rows.find((item) => item.id === equal("project_id") && String(item.revision) === equal("revision"));
      const result = row ? [{ payload: row.payload, schema_version: 1 }] : [];
      return send(request.headers.accept?.includes("object") ? result[0] ?? null : result);
    }
    if (url.pathname === "/rest/v1/rpc/save_project") {
      let row = body.p_project_id ? rows.find((item) => item.id === body.p_project_id) : rows.find((item) => item.draft_id === body.p_draft_id);
      if (body.p_project_id && !row) return send({ code: "42501" }, 403);
      if (row?.operations.has(body.p_operation_id)) return send(row.operations.get(body.p_operation_id));
      if (conflict || (row?.revision ?? 0) !== body.p_expected_revision) return send({ code: "40001" }, 409);
      if (!row) { row = { id: randomUUID(), revision: 0, draft_id: body.p_draft_id, user_id: owner, operations: new Map() }; rows.push(row); }
      row.payload = body.p_payload; row.title = body.p_payload.metadata.name; row.revision++; row.updated_at = new Date().toISOString(); saves++;
      const result = { id: row.id, revision: row.revision }; row.operations.set(body.p_operation_id, result); return send(result);
    }
    if (url.pathname === "/rest/v1/rpc/delete_project") {
      const row = rows.find((item) => item.id === body.p_project_id);
      if (!row) return send({ code: "42501" }, 403);
      if (conflict || row.revision !== body.p_expected_revision) return send({ code: "40001" }, 409);
      rows = rows.filter((item) => item !== row); return send(null);
    }
    send({ message: "Unhandled fixture path" }, 404);
  });
  await new Promise((resolve) => server.listen(3031, "127.0.0.1", resolve));
  return server;
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) await startSupabaseFixture();
