import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { fixture } from "../../features/simulator/tests/fixtures";
import type { Draft } from "../../features/projects/local/drafts";

const required = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "RLS_USER_A_EMAIL", "RLS_USER_A_PASSWORD", "RLS_USER_B_EMAIL", "RLS_USER_B_PASSWORD"] as const;
for (const name of required) if (!process.env[name]) throw new Error(`Remote verification requires ${name}.`);
const client = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { fetch: (url, init) => fetch(url, { ...init, signal: AbortSignal.timeout(20000) }) },
});
const source = "void setup(){pinMode(13,OUTPUT);Serial.begin(9600);}void loop(){digitalWrite(13,HIGH);Serial.println(13);delay(500);digitalWrite(13,LOW);delay(500);}";

async function login(page: Page, next: string, account: "A" | "B" = "A") {
  await page.goto(`/masuk?next=${encodeURIComponent(next)}`);
  await page.getByLabel("Email", { exact: true }).fill(process.env[`RLS_USER_${account}_EMAIL`]!);
  await page.getByLabel("Kata sandi", { exact: true }).fill(process.env[`RLS_USER_${account}_PASSWORD`]!);
  await page.getByRole("button", { name: "Masuk dengan email" }).click();
  await expect(page).toHaveURL(new RegExp(next + "$"));
}
async function stored(page: Page, owner: string): Promise<Draft | null> {
  return page.evaluate(async (owner) => {
    if (!(await indexedDB.databases()).some((entry) => entry.name === "vircuit-projects")) return null;
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("vircuit-projects", 1);
      request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
    });
    try {
      if (!db.objectStoreNames.contains("drafts")) return null;
      return await new Promise<Draft | null>((resolve, reject) => {
        const request = db.transaction("drafts").objectStore("drafts").get(`user:${owner}`);
        request.onsuccess = () => resolve(request.result ?? null); request.onerror = () => reject(request.error);
      });
    } finally { db.close(); }
  }, owner);
}
async function editCode(page: Page, value: string) {
  if (!page.url().includes("/simulator/code")) await page.getByRole("link", { name: "Code", exact: true }).click();
  await expect(page.locator(".monaco-editor")).toBeVisible();
  await page.evaluate((value) => {
    const editor = (window as unknown as { __vircuitEditor?: { setValue(value: string): void } }).__vircuitEditor;
    if (!editor) throw new Error("Editor not ready"); editor.setValue(value);
  }, value);
}

test("real remote autosave, acknowledgement, recovery, other session, conflict, ownership and management", async ({ page, browser }, testInfo) => {
  const a = client();
  const auth = await a.auth.signInWithPassword({ email: process.env.RLS_USER_A_EMAIL!, password: process.env.RLS_USER_A_PASSWORD! });
  expect(auth.error).toBeNull();
  const owner = auth.data.user!.id;
  const title = `Remote verification ${randomUUID()}`;
  const circuit = { ...fixture({ board: "uno", r: "resistor", led: "led" }, [["board.D13", "r.1"], ["r.2", "led.A"], ["led.K", "board.GND"]], source), metadata: { name: title }, viewport: { x: 15, y: 20, zoom: 1.2 } };
  circuit.components[1].rotation = 90;
  let id: string | undefined;
  let release = () => {};
  const held = new Promise<void>((resolve) => { release = resolve; });
  const device = await browser.newContext({ baseURL: "http://localhost:3003", viewport: { width: 390, height: 844 } });
  const outsider = await browser.newContext({ baseURL: "http://localhost:3003" });
  try {
    page.on("response", (response) => {
      if (new URL(response.url()).pathname === "/api/projects" && response.request().method() === "POST") console.log(`Remote browser save response: ${response.status()}`);
    });
    page.on("requestfailed", (request) => {
      if (new URL(request.url()).pathname === "/api/projects") console.log(`Remote browser save network failure: ${request.failure()?.errorText}`);
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await login(page, "/dashboard/projects");
    await page.getByRole("button", { name: "Proyek baru", exact: true }).first().click();
    await expect(page).toHaveURL(/\/simulator$/);
    await expect.poll(async () => !!(await stored(page, owner))).toBe(true);
    expect((await stored(page, owner))!.cloud).toBeNull();
    let delayed = false;
    await page.route("**/api/projects", async (route) => {
      if (route.request().method() !== "POST" || delayed) return route.continue();
      delayed = true;
      const response = await route.fetch();
      expect(response.status()).toBe(200);
      await held;
      await route.fulfill({ response });
    });
    await page.getByRole("button", { name: "Buka menu proyek" }).click();
    await page.getByLabel("Impor JSON", { exact: true }).setInputFiles({ name: "remote-project.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(circuit)) });
    if (await page.getByRole("dialog").isVisible()) await page.keyboard.press("Escape");
    await expect(page.locator(".react-flow__node")).toHaveCount(3);
    await expect.poll(async () => {
      const result = await a.from("projects").select("id").eq("title", title);
      expect(result.error).toBeNull(); return result.data?.length;
    }).toBe(1);
    expect((await stored(page, owner))!.cloud).toBeNull();
    await expect(page.getByText("Tersimpan di akun", { exact: true })).not.toBeVisible();
    release();
    await expect(page.getByText("Tersimpan di akun", { exact: true })).toBeVisible();
    await page.unroute("**/api/projects");
    const first = (await stored(page, owner))!;
    id = first.cloud!.id;
    expect(first.cloud!.revision).toBe(1);
    console.log(`Remote browser: created ${id}, revision 1; saved label waited for HTTP acknowledgement.`);
    const remote = await a.from("project_snapshots").select("payload").eq("project_id", id).eq("revision", 1).single();
    expect(remote.error).toBeNull(); expect(remote.data!.payload).toEqual(first.project);
    await page.reload();
    await expect(page.locator(".react-flow__node")).toHaveCount(3);
    expect((await stored(page, owner))!.cloud!.id).toBe(id);
    await page.screenshot({ path: testInfo.outputPath("remote-saved-workspace.png") });
    await page.getByRole("button", { name: "Run", exact: true }).click();
    await expect(page.getByTestId("output-led")).toHaveAttribute("data-value", "1");
    await page.getByRole("button", { name: "Stop", exact: true }).click();
    await editCode(page, source);
    await page.context().setOffline(true);
    await editCode(page, source + "\n// remote offline latest");
    await expect(page.getByRole("button", { name: "Coba simpan lagi", exact: true })).toBeVisible();
    expect((await stored(page, owner))!.pending).not.toBeNull();
    await expect(page.getByText("Tersimpan di akun", { exact: true })).not.toBeVisible();
    await page.context().setOffline(false);
    await expect(page.getByText("Tersimpan di akun", { exact: true })).toBeVisible();
    await page.goto("/dashboard/projects");
    await expect(page.getByRole("link", { name: `Buka proyek ${title}`, exact: true })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath("remote-dashboard-project.png") });
    const other = await device.newPage(); await login(other, "/dashboard/projects");
    await other.getByRole("link", { name: `Buka proyek ${title}`, exact: true }).click();
    await expect.poll(async () => (await stored(other, owner))?.cloud?.id).toBe(id);
    expect((await stored(other, owner))!.project.components).toEqual(first.project.components);
    expect((await stored(other, owner))!.project.wires).toEqual(first.project.wires);
    expect((await stored(other, owner))!.project.code.source).toContain("remote offline latest");
    await editCode(other, source + "\n// remote other session");
    await expect.poll(async () => { const draft = await stored(other, owner); return !!draft && draft.project.code.source.includes("remote other session") && draft.localRevision === draft.savedLocalRevision; }).toBe(true);
    const latestSnapshot = await a.from("project_snapshots").select("payload").eq("project_id", id).order("revision", { ascending: false }).limit(1).single();
    expect(latestSnapshot.error).toBeNull();
    expect(latestSnapshot.data!.payload.code.source).toContain("remote other session");
    console.log("Remote browser: reload, offline retry and fresh mobile session verified against Supabase snapshots.");
    await page.goto("/simulator/code");
    console.log(`Remote browser: local revision ${(await stored(page, owner))?.cloud?.revision}, remote revision ${(await a.from("projects").select("revision").eq("id", id).single()).data?.revision}.`);
    await editCode(page, source + "\n// remote stale local");
    await expect(page.getByRole("alert").filter({ hasText: "Revision berbeda" })).toBeVisible({ timeout: 45000 });
    expect((await stored(page, owner))!.project.code.source).toContain("remote stale local");
    const denied = await outsider.newPage(); await login(denied, "/dashboard/projects", "B");
    await expect(denied.getByRole("link", { name: `Buka proyek ${title}`, exact: true })).toHaveCount(0);
    const forbidden = await denied.request.get(`/api/projects/${id}`);
    expect(forbidden.status()).toBe(404);
    const revision = (await stored(other, owner))!.cloud!.revision;
    const forbiddenDelete = await denied.request.delete(`/api/projects/${id}`, { headers: { Origin: "http://localhost:3003" }, data: { expectedRevision: revision } });
    expect(forbiddenDelete.status()).toBe(404);
    await page.goto("/dashboard/projects");
    await page.getByRole("button", { name: `Tindakan ${title}`, exact: true }).click();
    await page.getByRole("menuitem", { name: "Ubah nama" }).click();
    const renamed = title + " renamed";
    await page.getByLabel("Nama proyek", { exact: true }).fill(renamed);
    await page.getByRole("button", { name: "Simpan nama" }).click();
    await expect(page.getByRole("heading", { name: renamed, exact: true })).toBeVisible();
    await page.getByRole("button", { name: `Tindakan ${renamed}`, exact: true }).click();
    await page.getByRole("menuitem", { name: "Hapus", exact: true }).click();
    await expect(page.getByRole("dialog")).toContainText(renamed);
    await page.getByRole("button", { name: "Hapus proyek", exact: true }).click();
    await expect(page.getByRole("heading", { name: renamed, exact: true })).toHaveCount(0);
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect.poll(async () => {
      const removed = await a.from("projects").select("id").eq("id", id);
      expect(removed.error).toBeNull(); return removed.data;
    }).toEqual([]);
    await page.getByRole("button", { name: "Menu akun" }).click();
    await page.getByRole("menuitem", { name: "Keluar akun" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Keluar akun", exact: true }).click();
    await expect(page).toHaveURL(/\/masuk/);
    expect(await stored(page, owner)).toBeNull();
    await login(page, "/dashboard/projects");
    await expect(page.getByRole("heading", { name: "Belum ada proyek tersimpan" })).toBeVisible();
  } finally {
    release();
    await page.context().setOffline(false);
    await device.close(); await outsider.close();
    // Only this run's unique title, owned by its authenticated test user.
    const rows = await a.from("projects").select("id,revision").eq("user_id", owner).like("title", `${title}%`);
    for (const row of rows.data ?? []) {
      const removed = await a.rpc("delete_project", { p_project_id: row.id, p_expected_revision: row.revision });
      expect(removed.error, "Test project cleanup").toBeNull();
    }
    await a.auth.signOut({ scope: "local" });
  }
});
