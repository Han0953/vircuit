import { test, expect } from "@playwright/test";

test("production excludes the local testing account", async ({ page, request }) => {
  expect((await request.get("/demo")).status()).toBe(404);
  expect((await request.get("/demo/projects")).status()).toBe(404);
  await page.goto("/masuk");
  await expect(page.getByRole("button", { name: "Masuk sebagai akun testing lokal" })).toHaveCount(0);
});
