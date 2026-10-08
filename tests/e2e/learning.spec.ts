import { test, expect, type Page } from "@playwright/test";
import { fixture } from "../../features/simulator/tests/fixtures";
const provider = "http://127.0.0.1:3031";
const owner = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const lesson = "/dashboard/learn/dasar-iot/blink";
async function login(page: Page) {
  await page.getByLabel("Email", { exact: true }).fill("dashboard@example.test");
  await page.getByLabel("Kata sandi", { exact: true }).fill("fixture-password");
  await page.getByRole("button", { name: "Masuk dengan email" }).click();
}
async function localDraft(page: Page) {
  return page.evaluate(async (scope) => {
    const db = await new Promise<IDBDatabase>((resolve) => { const r = indexedDB.open("vircuit-projects", 1); r.onsuccess = () => resolve(r.result); });
    return new Promise<{ id: string; learningContext: { lessonId: string; intent: string } | null; project: { metadata: { name: string }; components: unknown[] }; cloud: { id: string } | null }>((resolve) => {
      const r = db.transaction("drafts").objectStore("drafts").get(scope); r.onsuccess = () => { db.close(); resolve(r.result); };
    });
  }, `user:${owner}`);
}
test.beforeEach(async ({ request, page }) => {
  await request.post(`${provider}/__fixture/reset`, { data: { count: 0 } });
  await page.route("https://*.supabase.co/auth/v1/**", async (route) => {
    const url = new URL(route.request().url());
    await route.fulfill({ response: await route.fetch({ url: `${provider}${url.pathname}${url.search}` }) });
  });
});
test("learning is protected, preserves destination, renders real ordered content and safe 404s", async ({ page, request }) => {
  const guarded = await request.get(lesson, { maxRedirects: 0, headers: { "x-vircuit-path": "/dashboard/projects" } });
  expect(decodeURIComponent(guarded.headers().location ?? "")).toContain(`next=${lesson}`);
  const practiceTarget = "/simulator?lesson=lesson.blink&practice=bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
  const practiceGuarded = await request.get(practiceTarget, { maxRedirects: 0 });
  expect(new URL(practiceGuarded.headers().location!, "http://localhost:3002").searchParams.get("next")).toBe(practiceTarget);
  const codePracticeTarget = practiceTarget.replace("/simulator?", "/simulator/code?");
  const codeGuarded = await request.get(codePracticeTarget, { maxRedirects: 0 });
  expect(new URL(codeGuarded.headers().location!, "http://localhost:3002").searchParams.get("next")).toBe(codePracticeTarget);
  expect((await request.get(`/api/learning/practice?${practiceTarget.split("?")[1]}`)).status()).toBe(401);
  await page.goto("/belajar"); await expect(page.getByRole("heading", { level: 1 })).toContainText("Belajar dengan membangun");
  await page.goto(lesson); await expect(page).toHaveURL(/\/masuk\?next=/);
  expect(new URL(page.url()).searchParams.get("next")).toBe(lesson);
  await login(page); await expect(page).toHaveURL(new RegExp(`${lesson}$`));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Arduino Uno dan Blink");
  await expect(page.getByLabel("Contoh kode")).toContainText("digitalWrite(3, HIGH)");
  await page.getByRole("link", { name: /^Berikutnya/ }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Push Button dan digitalRead");
  await page.getByRole("link", { name: /^Sebelumnya/ }).click();
  await expect(page).toHaveURL(new RegExp(`${lesson}$`));
  await page.goto("/dashboard/learn/dasar-iot");
  await expect(page.getByRole("navigation", { name: "Daftar lesson" }).getByRole("link")).toHaveCount(7);
  await page.goto("/dashboard/learn/dasar-iot/no-lesson");
  await expect(page.getByRole("heading", { name: "Materi tidak ditemukan" })).toBeVisible();
  await page.goto("/dashboard/learn/no-course");
  await expect(page.getByRole("heading", { name: "Materi tidak ditemukan" })).toBeVisible();
  await page.goto("/dashboard"); await page.getByRole("link", { name: "Buka Belajar", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Belajar dengan praktik" })).toBeVisible();
});
test("practice confirms replacement, backs up circuit, runs, restores context and returns to lesson", async ({ page }) => {
  await page.goto("/masuk"); await login(page); await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/simulator");
  const original = fixture({ board: "uno", r: "resistor", led: "led" }, [["board.D13", "r.1"], ["r.2", "led.A"], ["led.K", "board.GND"]], "void setup(){pinMode(13,OUTPUT);}void loop(){digitalWrite(13,HIGH);delay(500);}");
  original.metadata.name = "Rangkaian penting";
  await page.getByRole("button", { name: "Buka menu proyek" }).click();
  await page.getByLabel("Impor JSON", { exact: true }).setInputFiles({ name: "original.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(original)) });
  if (await page.getByRole("dialog").isVisible()) await page.keyboard.press("Escape");
  await expect(page.locator(".react-flow__node")).toHaveCount(3);
  await page.getByRole("button", { name: "Kembali ke dashboard" }).click();
  await page.goto(lesson); await page.getByRole("button", { name: "Praktikkan di Lab" }).click();
  await expect(page.getByRole("dialog")).toContainText("Buka praktik baru?");
  await page.getByRole("button", { name: "Tetap di proyek saat ini" }).click();
  expect((await localDraft(page)).project.metadata.name).toBe(original.metadata.name);
  await page.goto(lesson); await page.getByRole("button", { name: "Praktikkan di Lab" }).click();
  await expect(page.getByRole("dialog")).toContainText("Buka praktik baru?");
  const commandUrl = page.url();
  await page.getByRole("button", { name: "Buka praktik baru", exact: true }).click();
  await expect(page).toHaveURL(/\/simulator$/);
  await expect(page.getByRole("region", { name: "Konteks praktik" })).toContainText("Arduino Uno dan Blink");
  const installed = await localDraft(page);
  expect(installed.learningContext?.lessonId).toBe("lesson.blink"); expect(installed.cloud).toBeNull();
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await expect(page.getByTestId("output-led")).toHaveAttribute("data-value", "1");
  await page.getByRole("button", { name: "Stop", exact: true }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: "Kembali ke lesson" })).toBeVisible();
  expect((await localDraft(page)).id).toBe(installed.id);
  await page.goto(commandUrl); await expect(page).toHaveURL(/\/simulator$/);
  expect((await localDraft(page)).id).toBe(installed.id);
  await page.getByRole("button", { name: "Kembali ke lesson" }).click();
  await expect(page).toHaveURL(new RegExp(`${lesson}$`));
  await page.goto("/simulator");
  await page.getByRole("button", { name: "Buka menu proyek" }).click();
  await expect(page.getByRole("region", { name: "Arsip draft lokal" })).toContainText("Rangkaian penting");
  await page.getByRole("region", { name: "Arsip draft lokal" }).locator("div").filter({ has: page.getByText("Rangkaian penting", { exact: true }) }).getByRole("button", { name: "Pulihkan" }).click();
  await expect(page.getByRole("heading", { name: "Rangkaian penting" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Kembali ke lesson" })).toHaveCount(0);
});
test("mobile learning navigation, keyboard focus, all themes and handoff failure preserve usability", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto(lesson); await login(page); await expect(page).toHaveURL(new RegExp(`${lesson}$`));
  await page.getByRole("button", { name: "Daftar lesson", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible(); await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Daftar lesson", exact: true })).toBeFocused();
  for (const theme of ["Terang", "Gelap", "Sistem"]) {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.getByRole("button", { name: /^Pilih tema:/ }).click();
    await page.getByRole("menuitemradio", { name: theme }).click();
    await expect(page.locator("html")).toHaveClass(theme === "Terang" ? /light/ : /dark/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.screenshot({ path: "test-results/learning-mobile.png", fullPage: true });
  await page.getByRole("button", { name: "Buka navigasi", exact: true }).click();
  await page.getByRole("dialog").getByRole("link", { name: "Belajar", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Belajar dengan praktik" })).toBeVisible();
  await page.goto(lesson);
  await page.route("**/api/learning/practice?**", (route) => route.fulfill({ status: 503, json: { error: "Praktik offline" } }));
  await page.getByRole("button", { name: "Praktikkan di Lab" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Praktik offline" })).toBeVisible();
  await page.getByRole("button", { name: "Tetap di proyek saat ini" }).click();
  await expect(page.getByRole("button", { name: "Run", exact: true })).toBeVisible();
  expect((await localDraft(page)).learningContext).toBeNull();
  for (const width of [430, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 }); await page.goto(lesson);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.screenshot({ path: "test-results/learning-desktop.png", fullPage: true });
});
