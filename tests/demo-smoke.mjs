import { chromium, expect as baseExpect } from "@playwright/test";
const expect = baseExpect.configure({ timeout: 30000 });

// Run against pnpm dev. Uses an isolated browser context and never Supabase fixtures.
const browser = await chromium.launch({ channel: "msedge" });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const cloud = [];
  page.on("request", (request) => { if (request.url().includes("supabase.co") || new URL(request.url()).pathname.startsWith("/api/")) cloud.push(request.url()); });
  await page.goto(`${process.env.DEMO_BASE_URL ?? "http://localhost:3000"}/masuk`);
  await page.getByRole("button", { name: "Masuk sebagai akun testing lokal" }).click();
  await expect(page.getByRole("heading", { name: "Halo, Pengguna Testing Lokal" })).toBeVisible();
  await page.getByRole("button", { name: "Proyek baru", exact: true }).click();
  await expect(page.getByRole("button", { name: "Run", exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/simulator$/);
  const project = { schemaVersion: 1, metadata: { name: "Testing lokal" }, components: [{ id: "board", type: "uno", label: "Arduino Uno", position: { x: 0, y: 0 }, rotation: 0, properties: {} }], wires: [], viewport: { x: 0, y: 0, zoom: 1 }, code: { language: "arduino-cpp-subset", source: "void setup(){}void loop(){delay(10);}" }, settings: { boardId: "board" } };
  await page.getByLabel("Impor JSON", { exact: true }).setInputFiles({ name: "demo.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(project)) });
  await expect(page.locator(".react-flow__node")).toHaveCount(1);
  await page.getByRole("button", { name: "Simpan proyek", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Tersimpan lokal" })).toBeVisible();
  await page.reload();
  await expect(page.locator(".react-flow__node")).toHaveCount(1);
  await page.getByRole("button", { name: "Kembali ke dashboard" }).click();
  await expect(page.getByRole("heading", { name: "Testing lokal", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Ubah nama", exact: true }).click();
  await page.getByLabel("Nama proyek", { exact: true }).fill("Testing diganti");
  await page.getByRole("button", { name: "Simpan nama", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Testing diganti", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Buka proyek", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Testing diganti", exact: true })).toBeVisible();
  await expect(page.locator(".react-flow__node")).toHaveCount(1);
  await page.getByRole("button", { name: "Kembali ke dashboard" }).click();
  await page.setViewportSize({ width: 360, height: 800 });
  await page.getByRole("button", { name: "Buka navigasi" }).click();
  await page.getByRole("dialog").getByRole("link", { name: "Proyek Saya" }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("button", { name: "Keluar demo", exact: true }).click();
  await page.getByRole("button", { name: "Masuk sebagai akun testing lokal" }).click();
  await expect(page.getByRole("heading", { name: "Testing diganti", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Hapus", exact: true }).click();
  await page.getByRole("button", { name: "Hapus proyek", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Belum ada proyek", exact: true })).toBeVisible();
  expect(cloud).toEqual([]);
  console.log("PASS: demo login, local save/recovery, rename/open/delete, logout retention, mobile navigation; zero cloud requests.");
} finally { await browser.close(); }
