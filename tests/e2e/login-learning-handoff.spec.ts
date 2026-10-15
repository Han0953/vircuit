import { expect, test } from "@playwright/test";

const provider = "http://127.0.0.1:3031";
test.beforeEach(async ({ request, page }) => {
  await request.post(`${provider}/__fixture/reset`, { data: { count: 4 } });
  await page.route("https://*.supabase.co/auth/v1/**", async (route) => {
    const url = new URL(route.request().url());
    await route.fulfill({ response: await route.fetch({ url: `${provider}${url.pathname}${url.search}` }) });
  });
  await page.addInitScript(() => {
    new MutationObserver(() => {
      if (/Menyiapkan halaman akun|Menyiapkan akun/.test(document.body?.innerText ?? "")) document.documentElement.dataset.accountPreparationSeen = "true";
    }).observe(document, { childList: true, subtree: true, characterData: true });
  });
});

for (const width of [390, 1440]) test(`login reaches requested learning page without account preparation at ${width}px`, async ({ page }, info) => {
  await page.setViewportSize({ width, height: 900 });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/dashboard/learn");
  await expect(page).toHaveURL(/\/masuk\?next=%2Fdashboard%2Flearn/);
  await page.getByLabel("Email", { exact: true }).fill("dashboard@example.test");
  await page.getByLabel("Kata sandi", { exact: true }).fill("fixture-password");
  await page.getByRole("button", { name: "Masuk dengan email" }).click();
  await expect(page).toHaveURL(/\/dashboard\/learn$/, { timeout: 12000 });
  await expect(page.locator("[data-auth-door]")).toHaveCount(0, { timeout: 10000 });
  await expect(page.locator("#dashboard-main h1")).toHaveText("Dasar IoT dengan Arduino Uno");
  await expect(page.locator("#dashboard-main h1")).toBeVisible();
  await expect(page.getByText(/Menyiapkan halaman akun|Menyiapkan akun/)).toHaveCount(0);
  await expect(page.locator("html")).not.toHaveAttribute("data-account-preparation-seen");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
  await expect.poll(() => page.locator("#dashboard-main [data-motion]").evaluateAll((items) => items.length > 0 && items.every((item) => Number(getComputedStyle(item).opacity) >= 0.99)), { timeout: 10000 }).toBe(true);
  await page.screenshot({ path: info.outputPath("learning-after-login.png"), fullPage: true });
  await page.reload();
  await expect(page.locator("#dashboard-main h1")).toHaveText("Dasar IoT dengan Arduino Uno");
  await expect(page.locator("#dashboard-main h1")).toBeVisible();
  await expect(page.locator("[data-auth-door]")).toHaveCount(0);
  await expect(page.locator("[data-dashboard-shell]")).not.toHaveAttribute("data-login-intro");
});

for (const width of [390, 1440]) test(`learning login after a client-side anonymous redirect does not reuse that redirect at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.goto("/");
  await page.getByRole("link", { name: "Lihat materi dan tantangan" }).click();
  await expect(page).toHaveURL(/\/masuk\?next=%2Fdashboard%2Flearn/);
  await page.getByLabel("Email", { exact: true }).fill("dashboard@example.test");
  await page.getByLabel("Kata sandi", { exact: true }).fill("fixture-password");
  await page.getByRole("button", { name: "Masuk dengan email" }).click();
  await expect(page).toHaveURL(/\/dashboard\/learn$/, { timeout: 10000 });
  await expect(page.locator("[data-auth-door]")).toHaveCount(0);
  await expect(page.locator("#dashboard-main h1")).toHaveText("Dasar IoT dengan Arduino Uno");
  await expect(page.locator("#dashboard-main h1")).toBeVisible();
  await expect(page.locator("html")).not.toHaveAttribute("data-account-preparation-seen");
});

test("an existing verified session redirects before streaming account preparation", async ({ page }) => {
  const response = await page.request.post("/api/auth/login", {
    headers: { Origin: "http://localhost:3002" },
    data: { credentials: { email: "dashboard@example.test", password: "fixture-password" } },
  });
  expect(response.ok()).toBe(true);
  const redirect = await page.request.get("/masuk?next=%2Fdashboard%2Flearn", { maxRedirects: 0 });
  expect(redirect.status()).toBe(307);
  expect(redirect.headers().location).toBe("/dashboard/learn");
  expect(await redirect.text()).not.toContain("Menyiapkan halaman akun");
});

test("reduced-motion learning login also discards the anonymous route tree", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("link", { name: "Lihat materi dan tantangan" }).click();
  await expect(page).toHaveURL(/\/masuk\?next=%2Fdashboard%2Flearn/);
  await page.getByLabel("Email", { exact: true }).fill("dashboard@example.test");
  await page.getByLabel("Kata sandi", { exact: true }).fill("fixture-password");
  await page.getByRole("button", { name: "Masuk dengan email" }).click();
  await expect(page.locator("#dashboard-main h1")).toHaveText("Dasar IoT dengan Arduino Uno");
  await expect(page.locator("[data-auth-door]")).toHaveCount(0);
  await expect(page.locator("[data-dashboard-shell]")).not.toHaveAttribute("data-login-intro");
});

test("failed navigation restores the filled login form and a retry reaches learning", async ({ page }) => {
  await page.goto("/masuk?next=%2Fdashboard%2Flearn");
  await page.route("**/masuk?next=*", async (route) => {
    if (route.request().method() === "POST" && route.request().headers()["next-action"]) {
      await route.fulfill({ status: 503, contentType: "text/plain", body: "Local navigation failure" });
    } else await route.continue();
  });
  await page.getByLabel("Email", { exact: true }).fill("dashboard@example.test");
  await page.getByLabel("Kata sandi", { exact: true }).fill("fixture-password");
  await page.getByRole("button", { name: "Masuk dengan email" }).click();
  await expect(page.locator("[data-auth-door]")).toHaveCount(0);
  await expect(page.locator("[data-auth-feedback]")).toContainText("Koneksi gagal");
  await expect(page.getByLabel("Kata sandi", { exact: true })).toHaveValue("fixture-password");
  await expect(page.locator("[data-dashboard-shell]")).toHaveCount(0);
  await page.unroute("**/masuk?next=*");
  await page.getByRole("button", { name: "Masuk dengan email" }).click();
  await expect(page.locator("#dashboard-main h1")).toHaveText("Dasar IoT dengan Arduino Uno");
  await expect(page.locator("[data-auth-door]")).toHaveCount(0);
});
