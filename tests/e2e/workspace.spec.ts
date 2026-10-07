import { test, expect } from "@playwright/test";

test("desktop panels resize, collapse independently, restore focus and persist", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/simulator");
  const left = page.getByTestId("left");
  const width = async () => (await left.boundingBox())!.width;
  await expect(page.getByRole("button", { name: "Toggle Parts", exact: true })).toBeEnabled();
  const divider = page.getByRole("separator", { name: "Ubah lebar Parts" });
  await divider.focus();
  const before = await width();
  await page.keyboard.press("ArrowRight");
  await expect.poll(width).toBeGreaterThan(before);
  await page.getByRole("button", { name: "Toggle Properties", exact: true }).click();
  await expect.poll(async () => (await page.getByTestId("right").boundingBox())!.width).toBe(0);
  const saved = await width();
  await page.getByRole("button", { name: "Focus Mode", exact: true }).click();
  await expect.poll(width).toBe(0);
  await expect.poll(async () => (await page.getByTestId("bottom").boundingBox())!.height).toBe(0);
  await page.getByRole("button", { name: "Focus Mode", exact: true }).click();
  await expect.poll(width).toBeCloseTo(saved, 0);
  await page.reload();
  await expect.poll(width).toBeCloseTo(saved, 0);
  await expect.poll(async () => (await page.getByTestId("right").boundingBox())!.width).toBe(0);
  await page.getByRole("button", { name: "Toggle Parts", exact: true }).click();
  await page.getByRole("button", { name: "Toggle Panel bawah", exact: true }).click();
  await expect.poll(width).toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});

test("mobile keeps canvas and accessible sheets", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/simulator");
  await page.getByRole("button", { name: "Parts", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});
