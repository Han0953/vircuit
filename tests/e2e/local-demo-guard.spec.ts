import { test, expect } from "@playwright/test";

test("removed demo routes and stale demo flag cannot grant account access", async ({ page, request }) => {
  expect((await request.get("/demo")).status()).toBe(404);
  expect((await request.get("/demo/projects")).status()).toBe(404);
  await page.addInitScript(() => localStorage.setItem("vircuit-demo-active", "1"));
  await page.goto("/masuk");
  await expect(page.getByRole("button", { name: "Masuk sebagai akun testing lokal" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Masuk dengan email" })).toBeVisible();
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/masuk\?next=/);
  await page.goto("/simulator");
  await expect(page.getByText("Tamu", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Keluar akun", exact: true })).toHaveCount(0);
});
