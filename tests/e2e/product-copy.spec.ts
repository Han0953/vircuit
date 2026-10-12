import { expect, test, type Page } from "@playwright/test";
import { learningCatalog, lessonHref } from "../../features/learning/registry";

const fixture = "http://127.0.0.1:3031";
const unfinishedCopy = /\b(?:demo|prototype|prototipe|mockup|dummy|MVP|coming soon|segera hadir)\b/i;
async function checkCopy(page: Page) {
  expect(await page.locator("body").innerText()).not.toMatch(unfinishedCopy);
  expect(await page.title()).not.toMatch(unfinishedCopy);
  const attributes = await page.locator("[aria-label], [placeholder], meta[name='description']").evaluateAll((elements) =>
    elements.flatMap((el) => [el.getAttribute("aria-label"), el.getAttribute("placeholder"), el.getAttribute("content")]
      .filter((value): value is string => value !== null))
  );
  for (const value of attributes) {
    expect(value).not.toMatch(unfinishedCopy);
  }
}
async function login(page: Page) {
  await page.goto("/masuk");
  await page.getByLabel("Email", { exact: true }).fill("dashboard@example.test");
  await page.getByLabel("Kata sandi", { exact: true }).fill("fixture-password");
  await page.getByRole("button", { name: "Masuk dengan email" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}
test.beforeEach(async ({ page, request }) => {
  await request.post(`${fixture}/__fixture/reset`, { data: { count: 105 } });
  await page.route("https://*.supabase.co/auth/v1/**", async (route) => {
    const url = new URL(route.request().url());
    await route.fulfill({ response: await route.fetch({ url: `${fixture}${url.pathname}${url.search}` }) });
  });
});

test("public pages, auth forms and guest workspaces use product copy without hiding support limits", async ({ page }) => {
  test.setTimeout(90000);
  for (const path of ["/", "/fitur", "/belajar", "/jelajahi", "/harga", "/masuk", "/daftar", "/simulator", "/simulator/code"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    await checkCopy(page);
    if (path === "/harga") {
      await expect(page.locator("body")).toContainText("Dalam perencanaan");
      await expect(page.locator("body")).toContainText("Nano visual-only");
      await expect(page.locator("body")).toContainText("belum ditentukan");
    }
    if (path === "/jelajahi") await expect(page.locator("body")).toContainText("Pratinjau konsep");
  }
  await page.getByRole("button", { name: "Buka menu proyek" }).click();
  await expect(page.getByRole("dialog")).toContainText("arsip draft lokal");
  await checkCopy(page);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Buka Cirra", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Asisten Cirra" })).toContainText("Masuk untuk bertanya ke Cirra");
  await checkCopy(page);
});

test("account pages and all published lessons show real progress and accurately labelled project counts", async ({ page }) => {
  test.setTimeout(90000);
  await login(page);
  await expect(page.getByText("6 Proyek", { exact: true })).toBeVisible();
  await expect(page.getByText("Proyek terbaru", { exact: true })).toBeVisible();
  await expect(page.getByText("Topik kurikulum", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Lihat semua proyek", exact: true })).toBeVisible();
  const courses = learningCatalog();
  const paths = ["/dashboard", "/dashboard/projects", "/dashboard/progress", "/dashboard/challenges", "/dashboard/learn", ...courses.flatMap((course) => [`/dashboard/learn/${course.slug}`, ...course.lessons.map((lesson) => lessonHref(course, lesson))])];
  for (const path of paths) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    await checkCopy(page);
    if (path === "/dashboard/progress") {
      await expect(page.getByText("0% Selesai", { exact: true })).toBeVisible();
      expect(await page.locator('[data-motion="meter"]').evaluateAll((meters) => meters.every((el) => (el as HTMLElement).style.width === "0%"))).toBe(true);
    }
  }
  await page.goto("/dashboard/projects");
  await page.getByRole("link", { name: "Berikutnya", exact: true }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.getByRole("link", { name: "Buka proyek Proyek 025", exact: true })).toBeVisible();
  await page.goto("/simulator");
  await page.getByRole("button", { name: "Buka Cirra", exact: true }).click();
  await expect(page.locator("[data-cirra-greeting]")).toBeVisible();
  await checkCopy(page);
  await page.screenshot({ path: "playwright-report/product-copy-cirra.png" });
});

test("account data failure never claims zero progress or an existing local draft", async ({ page, request }) => {
  await login(page);
  await request.post(`${fixture}/__fixture/reset`, { data: { count: 0, failure: true } });
  await page.goto("/dashboard");
  await expect(page.getByText("Data tidak tersedia", { exact: true })).toHaveCount(3);
  await expect(page.getByText("Proyek gagal dimuat", { exact: true })).toBeVisible();
  await expect(page.getByText("Offline Draft", { exact: true })).toHaveCount(0);
  await expect(page.getByText(/0\/\d+ Materi/)).toHaveCount(0);
  await checkCopy(page);
  await page.screenshot({ path: "playwright-report/product-copy-dashboard-error.png" });
});

test("product copy remains readable in the mobile dark account workspace", async ({ page }) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await login(page);
  for (const path of ["/dashboard", "/dashboard/projects", "/dashboard/learn", "/dashboard/challenges", "/dashboard/progress", "/simulator", "/simulator/code"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    await checkCopy(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    if (path === "/dashboard") await page.screenshot({ path: "playwright-report/product-copy-mobile-dashboard.png" });
  }
});
