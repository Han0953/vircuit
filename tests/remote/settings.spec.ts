import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const client = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { fetch: (url, init) => fetch(url, { ...init, signal: AbortSignal.timeout(20000) }) },
});
async function login(page: Page, password = process.env.RLS_USER_A_PASSWORD!) {
  await page.goto("/masuk?next=%2Fdashboard%2Fpengaturan");
  await page.getByLabel("Email", { exact: true }).fill(process.env.RLS_USER_A_EMAIL!);
  await page.getByLabel("Kata sandi", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Masuk dengan email" }).click();
  await expect(page).toHaveURL(/\/dashboard\/pengaturan$/);
}

test("remote profile save/reload, cross-user isolation, offline recovery and sidebar logout", async ({ page, browser }, testInfo) => {
  const a = client(), b = client(), anonymous = client();
  const authA = await a.auth.signInWithPassword({ email: process.env.RLS_USER_A_EMAIL!, password: process.env.RLS_USER_A_PASSWORD! });
  const authB = await b.auth.signInWithPassword({ email: process.env.RLS_USER_B_EMAIL!, password: process.env.RLS_USER_B_PASSWORD! });
  expect(authA.error).toBeNull(); expect(authB.error).toBeNull();
  const owner = authA.data.user!.id;
  const previous = await a.from("profiles").select("display_name").eq("id", owner).maybeSingle();
  expect(previous.error).toBeNull();
  const restoredName = previous.data?.display_name || "Remote verification A";
  const name = `Profil Uji ${randomUUID().slice(0, 8)}`;
  try {
    expect((await anonymous.rpc("update_my_profile", { p_display_name: name })).error?.code).toBe("42501");
    expect((await a.rpc("update_my_profile", { p_display_name: "<script>" })).error?.code).toBe("22023");
    await login(page);
    await page.getByLabel("Nama tampilan").fill(name);
    const saved = page.waitForResponse((response) => response.url().endsWith("/api/settings/profile") && response.request().method() === "PATCH");
    await page.getByRole("button", { name: "Simpan profil" }).click();
    const response = await saved;
    expect(response.status()).toBe(200);
    expect(response.headers()["cache-control"]).toContain("no-store");
    await expect(page.getByRole("status").filter({ hasText: "Nama profil berhasil disimpan" })).toBeVisible();
    expect((await a.from("profiles").select("display_name").eq("id", owner).single()).data?.display_name).toBe(name);
    const foreign = await b.from("profiles").select("id").eq("id", owner);
    expect(foreign.error).toBeNull(); expect(foreign.data).toEqual([]);
    expect((await b.from("profiles").update({ display_name: "Forged" }).eq("id", owner)).error?.code).toBe("42501");
    expect((await b.from("profiles").delete().eq("id", owner)).error?.code).toBe("42501");
    const denied = await page.request.patch("/api/settings/profile", { headers: { Origin: "http://localhost:3003", "x-vircuit-owner": authB.data.user!.id }, data: { displayName: "Forged" } });
    expect(denied.status()).toBe(409);
    const markup = await page.request.patch("/api/settings/profile", { headers: { Origin: "http://localhost:3003", "x-vircuit-owner": owner }, data: { displayName: name, user_id: owner } });
    expect(markup.status()).toBe(400);
    const crossOrigin = await page.request.patch("/api/settings/profile", { headers: { Origin: "https://untrusted.example", "x-vircuit-owner": owner }, data: { displayName: name } });
    expect(crossOrigin.status()).toBe(403);
    await page.reload(); await expect(page.getByLabel("Nama tampilan")).toHaveValue(name);
    await page.getByRole("button", { name: "Menu akun" }).click();
    await expect(page.getByRole("menu")).toContainText(name);
    await expect(page.getByRole("menuitem", { name: "Keluar akun" })).toHaveCount(0);
    await page.keyboard.press("Escape");
    await page.context().setOffline(true);
    await page.getByLabel("Nama tampilan").fill(`${name} Lokal`);
    await page.getByRole("button", { name: "Simpan profil" }).click();
    await expect(page.locator("main").getByRole("alert")).toContainText("Koneksi gagal");
    await expect(page.getByLabel("Nama tampilan")).toHaveValue(`${name} Lokal`);
    await page.context().setOffline(false);
    await page.getByRole("button", { name: "Simpan profil" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Nama profil berhasil disimpan" })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath("remote-settings-desktop.png") });
    const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
    try {
      const phone = await mobile.newPage(); await login(phone);
      await expect(phone.getByLabel("Nama tampilan")).toHaveValue(`${name} Lokal`);
      await phone.getByRole("button", { name: "Lainnya" }).click();
      await expect.poll(async () => (await phone.getByRole("dialog").boundingBox())?.x ?? -1000).toBeGreaterThanOrEqual(-1);
      await phone.screenshot({ path: testInfo.outputPath("remote-settings-mobile.png") });
      await phone.getByRole("dialog").getByRole("button", { name: "Keluar akun", exact: true }).click();
      await phone.getByRole("dialog", { name: "Keluar dari akun?" }).getByRole("button", { name: "Keluar akun", exact: true }).click();
      await expect(phone).toHaveURL(/\/masuk/);
      await phone.goto("/dashboard/pengaturan"); await expect(phone).toHaveURL(/\/masuk\?next=/);
    } finally { await mobile.close(); }
  } finally {
    await page.context().setOffline(false);
    expect((await a.rpc("update_my_profile", { p_display_name: restoredName })).error).toBeNull();
    await a.auth.signOut(); await b.auth.signOut();
  }
});

test("remote private avatar upload, replacement, cross-user denial, reload and removal", async ({ page, browser }, testInfo) => {
  const a = client(), b = client();
  const aa = await a.auth.signInWithPassword({ email: process.env.RLS_USER_A_EMAIL!, password: process.env.RLS_USER_A_PASSWORD! });
  const bb = await b.auth.signInWithPassword({ email: process.env.RLS_USER_B_EMAIL!, password: process.env.RLS_USER_B_PASSWORD! });
  expect(aa.error).toBeNull(); expect(bb.error).toBeNull();
  const path = `${aa.data.user!.id}/avatar.webp`, bucket = "profile-avatars";
  const previous = await a.storage.from(bucket).download(path, { cacheNonce: randomUUID() });
  try {
    await login(page);
    let previousBytes: Buffer | null = null;
    for (let i = 0; i < 2; i++) {
      const png = await page.evaluate((i) => { const canvas = document.createElement("canvas"); canvas.width = canvas.height = 48; const ctx = canvas.getContext("2d")!; ctx.fillStyle = i ? "#ef4444" : "#245cff"; ctx.fillRect(0,0,48,48); return canvas.toDataURL("image/png").split(",")[1]; }, i);
      const uploaded = page.waitForResponse((response) => response.url().endsWith("/api/settings/avatar") && response.request().method() === "POST");
      await page.getByLabel("Pilih foto profil").setInputFiles({ name: `photo-${i}.png`, mimeType: "image/png", buffer: Buffer.from(png,"base64") });
      expect((await uploaded).status()).toBe(200);
      await expect(page.getByRole("status").filter({ hasText: "Foto profil berhasil disimpan" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Ganti foto", exact: true })).toBeVisible();
      const changed = await a.storage.from(bucket).download(path, { cacheNonce: randomUUID() });
      expect(changed.error).toBeNull();
      const freshBytes = Buffer.from(await changed.data!.arrayBuffer());
      if (previousBytes) expect(freshBytes).not.toEqual(previousBytes);
      previousBytes = freshBytes;
    }
    const stored = await a.storage.from(bucket).download(path, { cacheNonce: randomUUID() });
    expect(stored.error).toBeNull();
    const bytes = Buffer.from(await stored.data!.arrayBuffer());
    expect(bytes.toString("ascii",0,4)).toBe("RIFF");
    const foreign = await b.storage.from(bucket).download(path);
    expect(foreign.data).toBeNull(); expect(foreign.error?.message).toMatch(/not found|not authorized|Unauthorized/i);
    const spoof = await b.storage.from(bucket).upload(path,bytes,{ upsert: true, contentType:"image/webp" });
    expect(spoof.error?.message).toMatch(/row.level|Unauthorized|not authorized/i);
    await b.storage.from(bucket).remove([path]);
    expect(Buffer.from(await (await a.storage.from(bucket).download(path, { cacheNonce: randomUUID() })).data!.arrayBuffer())).toEqual(bytes);
    const publicRead = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`);
    expect(publicRead.ok).toBe(false);
    await page.reload();
    await expect.poll(() => page.locator("img[src*='/api/settings/avatar']").first().evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBe(256);
    await page.getByRole("heading", { name: "Foto profil", exact: true }).locator("xpath=../../..").screenshot({ path: testInfo.outputPath("remote-avatar-profile.png") });
    const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
    try {
      const phone = await mobile.newPage(); await login(phone);
      await expect.poll(() => phone.locator("img[src*='/api/settings/avatar']").first().evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBe(256);
      expect(await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await phone.getByRole("heading", { name: "Foto profil", exact: true }).locator("xpath=../../..").screenshot({ path: testInfo.outputPath("remote-avatar-mobile.png") });
    } finally { await mobile.close(); }
    await page.getByRole("button", { name: "Hapus foto", exact: true }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Hapus foto", exact: true }).click();
    await expect(page.getByRole("button", { name: "Unggah foto", exact: true })).toBeVisible();
    expect((await a.storage.from(bucket).download(path, { cacheNonce: randomUUID() })).data).toBeNull();
    expect((await page.request.get("/api/settings/avatar")).status()).toBe(404);
  } finally {
    if (previous.data) expect((await a.storage.from(bucket).upload(path,previous.data,{upsert:true,contentType:"image/webp"})).error).toBeNull();
    else await a.storage.from(bucket).remove([path]);
    await a.auth.signOut(); await b.auth.signOut();
  }
});

test("remote disposable account deletion requires verification and cascades own projects only", async ({ page }) => {
  test.skip(process.env.RUN_DISPOSABLE_ACCOUNT_DELETION !== "1", "Permanent disposable account deletion requires explicit opt-in.");
  test.skip(!process.env.SUPABASE_SECRET_KEY,"Remote disposable account setup requires server credential.");
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SECRET_KEY!,{auth:{persistSession:false,autoRefreshToken:false}});
  const email = `vircuit-delete-${randomUUID()}@example.com`, password = `Temporary-${randomUUID()}`;
  const created = await admin.auth.admin.createUser({email,password,email_confirm:true});
  expect(created.error).toBeNull(); const owner = created.data.user!.id;
  const disposable = client(); let deleted = false;
  try {
    expect((await disposable.auth.signInWithPassword({email,password})).error).toBeNull();
    expect((await disposable.rpc("update_my_profile",{p_display_name:"Disposable Settings Test"})).error).toBeNull();
    const payload = {schemaVersion:1,metadata:{name:"Disposable deletion verification"},components:[],wires:[],code:{language:"arduino-cpp-subset",source:"void setup(){} void loop(){}"},viewport:{x:0,y:0,zoom:1},settings:{boardId:null}};
    const project = await disposable.rpc("save_project",{p_project_id:null,p_draft_id:randomUUID(),p_expected_revision:0,p_operation_id:randomUUID(),p_payload:payload});
    expect(project.error).toBeNull();
    const projectId = project.data.id;
    await page.goto("/masuk?next=%2Fdashboard%2Fpengaturan");
    await page.getByLabel("Email",{exact:true}).fill(email); await page.getByLabel("Kata sandi",{exact:true}).fill(password);
    await page.getByRole("button",{name:"Tampilkan kata sandi",exact:true}).click();
    await expect(page.getByLabel("Kata sandi",{exact:true})).toHaveAttribute("type","text");
    await page.getByRole("button",{name:"Sembunyikan kata sandi",exact:true}).click();
    await page.getByRole("button",{name:"Masuk dengan email"}).click(); await expect(page).toHaveURL(/\/dashboard\/pengaturan$/);
    const picture = await page.evaluate(() => { const canvas = document.createElement("canvas"); canvas.width=canvas.height=32; canvas.getContext("2d")!.fillRect(0,0,32,32); return canvas.toDataURL("image/png").split(",")[1]; });
    await page.getByLabel("Pilih foto profil").setInputFiles({name:"disposable-avatar.png",mimeType:"image/png",buffer:Buffer.from(picture,"base64")});
    await expect(page.getByRole("button",{name:"Ganti foto",exact:true})).toBeVisible();
    expect((await admin.storage.from("profile-avatars").list(owner)).data?.some((file)=>file.name==="avatar.webp")).toBe(true);
    await page.getByRole("tab",{name:"Data & Privasi",exact:false}).click();
    await page.getByRole("button",{name:"Hapus akun",exact:true}).click();
    await page.getByLabel("Ketik HAPUS AKUN",{exact:true}).fill("HAPUS AKUN");
    await page.getByLabel("Kata sandi untuk konfirmasi",{exact:true}).fill("wrong-password");
    await page.getByRole("button",{name:"Hapus akun permanen",exact:true}).click();
    await expect(page.getByRole("dialog").getByRole("alert")).toContainText("Verifikasi akun tidak sesuai");
    expect((await admin.auth.admin.getUserById(owner)).data.user?.id).toBe(owner);
    await page.getByLabel("Kata sandi untuk konfirmasi",{exact:true}).fill(password);
    let deletionReply: unknown;
    let deletionStatus = 0;
    await page.route("**/api/settings/delete-account", async (route) => {
      const response = await route.fetch();
      deletionReply = await response.json(); deletionStatus = response.status();
      await route.fulfill({ response });
    });
    await page.getByRole("button",{name:"Hapus akun permanen",exact:true}).click();
    await expect.poll(() => deletionReply).toEqual({deleted:true}); expect(deletionStatus).toBe(200); deleted=true;
    await expect(page).toHaveURL(/\/masuk\?account=deleted/);
    await expect(page.getByRole("status").filter({ hasText: "Akun berhasil dihapus" })).toBeVisible();
    expect((await admin.auth.admin.getUserById(owner)).data.user).toBeNull();
    expect((await admin.from("profiles").select("id").eq("id",owner)).data).toEqual([]);
    expect((await admin.from("projects").select("id").eq("user_id",owner)).data).toEqual([]);
    expect((await admin.from("project_snapshots").select("id").eq("project_id",projectId)).data).toEqual([]);
    expect((await admin.storage.from("profile-avatars").list(owner)).data).toEqual([]);
    expect((await disposable.auth.getUser()).error).not.toBeNull();
  } finally { if (!deleted) await admin.auth.admin.deleteUser(owner); }
});
