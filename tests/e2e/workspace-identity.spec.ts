import { expect, test } from "@playwright/test";

test("guest sees Cirra icons, no info banner and returns home even with other history", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/masuk"); await page.goto("/simulator/code");
  await expect(page.getByRole("button", { name: "Kembali ke beranda" })).toBeVisible();
  await expect(page.getByText("Simulasi edukatif · Arduino C/C++ subset.", { exact: false })).toHaveCount(0);
  const bubble = page.getByRole("button", { name: "Buka Cirra", exact: true });
  await expect(bubble.locator("img")).toHaveCount(0);
  await expect(bubble.locator("svg")).toBeVisible();
  await bubble.click();
  const dialog = page.getByRole("dialog", { name: "Asisten Cirra" });
  await expect(dialog.getByRole("heading", { name: "Masuk untuk bertanya ke Cirra" })).toBeVisible();
  await expect(dialog.locator("img")).toHaveCount(0);
  await page.screenshot({ path: "playwright-report/cirra-icons-desktop.png" });
  await page.getByRole("button", { name: "Minimalkan Cirra" }).click();
  await page.getByRole("button", { name: "Kembali ke beranda" }).click();
  await expect(page).toHaveURL(/localhost:3002\/$/);
  expect(await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve) => { const open = indexedDB.open("vircuit-projects", 1); open.onsuccess = () => resolve(open.result); });
    return new Promise<boolean>((resolve) => { const request = db.transaction("drafts").objectStore("drafts").get("guest"); request.onsuccess = () => { db.close(); resolve(Boolean(request.result?.project)); }; });
  })).toBe(true);
});

test("signed-in mobile user returns to dashboard rather than the previous lesson", async ({ page, request }) => {
  const fixture = "http://127.0.0.1:3031";
  await request.post(`${fixture}/__fixture/reset`, { data: { count: 0 } });
  await page.route("https://*.supabase.co/auth/v1/**", async (route) => { const url = new URL(route.request().url()); await route.fulfill({ response: await route.fetch({ url: `${fixture}${url.pathname}${url.search}` }) }); });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/masuk"); await page.getByLabel("Email", { exact: true }).fill("dashboard@example.test");
  await page.getByLabel("Kata sandi", { exact: true }).fill("fixture-password");
  await page.getByRole("button", { name: "Masuk dengan email" }).click(); await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/dashboard/learn/dasar-iot/blink"); await page.goto("/simulator");
  await page.getByRole("button", { name: "Buka Cirra", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Asisten Cirra" });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("[data-cirra-greeting] img")).toBeVisible();
  await expect(dialog.locator("h2 img")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "playwright-report/cirra-icons-mobile.png" });
  await page.getByRole("button", { name: "Minimalkan Cirra" }).click();
  await page.getByRole("button", { name: "Kembali ke dashboard" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
});
