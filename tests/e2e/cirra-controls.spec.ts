import { test, expect, type Page } from "@playwright/test";
import { selectCirraMode } from "./helpers/cirra-controls";

const fixture = "http://127.0.0.1:3031";
async function login(page: Page) {
  await page.goto("/masuk");
  await page.getByLabel("Email", { exact: true }).fill("dashboard@example.test");
  await page.getByLabel("Kata sandi", { exact: true }).fill("fixture-password");
  await page.getByRole("button", { name: "Masuk dengan email" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}
test.beforeEach(async ({ request, page }) => {
  await request.post(`${fixture}/__fixture/reset`, { data: { count: 0 } });
  await page.route("https://*.supabase.co/auth/v1/**", async (route) => { const url = new URL(route.request().url()); await route.fulfill({ response: await route.fetch({ url: `${fixture}${url.pathname}${url.search}` }) }); });
});

for (const { width, workspace } of [{ width: 1440, workspace: false }, { width: 1280, workspace: true }, { width: 360, workspace: false }, { width: 390, workspace: true }, { width: 430, workspace: true }]) {
  test(`combined controls, slider, mode and clear at ${width}px ${workspace ? "simulator" : "dashboard"}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await login(page);
    await page.goto(workspace ? "/simulator" : "/dashboard/cirra");
    if (workspace) await page.getByRole("button", { name: "Buka Cirra", exact: true }).click();
    const chat = page.getByRole("region", { name: "Percakapan Cirra" });
    const trigger = chat.getByRole("button", { name: "Pengaturan Cirra", exact: true });
    await expect(trigger).toHaveCount(1);
    await expect(chat.getByRole("button", { name: "Opsi percakapan" })).toHaveCount(0);
    const input = chat.getByLabel("Pertanyaan untuk Cirra");
    await input.fill("Periksa resistor dan LED");
    const triggerBounds = (await trigger.boundingBox())!, sendBounds = (await chat.getByRole("button", { name: "Kirim", exact: true }).boundingBox())!;
    expect(triggerBounds.x + triggerBounds.width).toBeLessThan(sendBounds.x);
    expect(Math.abs(triggerBounds.y + triggerBounds.height / 2 - sendBounds.y - sendBounds.height / 2)).toBeLessThan(3);
    await trigger.click();
    const panel = page.getByRole("dialog", { name: "Pengaturan Cirra", exact: true });
    const slider = panel.getByRole("slider", { name: "Effort bantuan", exact: true });
    await slider.focus(); await slider.press("End");
    await expect(slider).toHaveAttribute("aria-valuenow", "3");
    await expect(slider).toHaveAttribute("aria-valuetext", "Tinggi");
    await expect(input).toHaveValue("Periksa resistor dan LED");
    const bounds = (await panel.boundingBox())!;
    expect(bounds.x).toBeGreaterThanOrEqual(0); expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
    expect(bounds.y).toBeGreaterThanOrEqual(0);
    await page.screenshot({ path: `test-results/cirra-controls-${width}.png`, fullPage: true, animations: "disabled" });
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
    await selectCirraMode(page, "Debugger");
    await expect(trigger).toHaveAttribute("data-value", "debugger");
    await expect(trigger).toHaveAttribute("data-effort", "3");
    const sent = page.waitForRequest("**/api/ai/cirra");
    await chat.getByRole("button", { name: "Kirim", exact: true }).click();
    expect((await sent).postDataJSON()).toMatchObject({ mode: "debugger", hintLevel: 3, message: "Periksa resistor dan LED" });
    await expect(chat.getByRole("log")).toContainText("wiring dan kode aktual");
    await trigger.click();
    await panel.getByRole("button", { name: /^Ganti mode:/ }).click();
    await expect(panel.getByRole("radio")).toHaveCount(3);
    await page.screenshot({ path: `test-results/cirra-modes-${width}.png`, fullPage: true, animations: "disabled" });
    await page.keyboard.press("Escape");
    await expect(slider).toBeVisible();
    await panel.getByRole("button", { name: "Hapus percakapan", exact: true }).click();
    await expect(chat.locator("[data-message-id]")).toHaveCount(0);
    await expect(chat.locator("[data-cirra-greeting]")).toBeVisible();
    await expect(trigger).toHaveAttribute("data-value", "debugger");
    await expect(trigger).toHaveAttribute("data-effort", "3");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (workspace) await expect(page.getByRole("dialog", { name: "Asisten Cirra", exact: true })).toBeVisible();
  });
}

test("effort slider supports dragging and pending locks controls without losing cancel", async ({ page }) => {
  await login(page); await page.goto("/dashboard/cirra");
  const trigger = page.getByRole("button", { name: "Pengaturan Cirra", exact: true });
  await trigger.click();
  const slider = page.getByRole("slider", { name: "Effort bantuan", exact: true });
  const thumb = (await slider.boundingBox())!;
  await page.mouse.move(thumb.x + thumb.width / 2, thumb.y + thumb.height / 2); await page.mouse.down();
  await page.mouse.move(thumb.x + 255, thumb.y + thumb.height / 2, { steps: 8 }); await page.mouse.up();
  await expect(slider).toHaveAttribute("aria-valuenow", "3");
  await slider.press("ArrowLeft"); await expect(slider).toHaveAttribute("aria-valuetext", "Sedang");
  await page.keyboard.press("Escape");
  await page.getByLabel("Pertanyaan untuk Cirra").fill("fixture-slow");
  await page.getByRole("button", { name: "Kirim", exact: true }).click();
  await expect(trigger).toBeDisabled();
  await page.getByRole("button", { name: "Hentikan", exact: true }).click();
  await expect(trigger).toBeEnabled();
});

test("slider movement and effort/mode fade animate; reduced motion stays instant", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await login(page); await page.goto("/dashboard/cirra");
  const trigger = page.getByRole("button", { name: "Pengaturan Cirra", exact: true });
  await trigger.click();
  const slider = page.getByRole("slider", { name: "Effort bantuan", exact: true });
  await slider.focus();
  const recording = page.evaluate(async () => {
    const positions = new Set<number>(), widths = new Set<number>(), fades: number[] = [];
    const start = performance.now();
    await new Promise<void>((resolve) => {
      const frame = () => {
        const thumb = document.querySelector('[data-cirra-effort-slider] [role="slider"]')!;
        const range = document.querySelector("[data-cirra-effort-range]")!;
        positions.add(Math.round(thumb.getBoundingClientRect().x)); widths.add(Math.round(range.getBoundingClientRect().width));
        const label = document.querySelector("[data-cirra-selection]")!;
        if (label.textContent?.includes("Tinggi")) fades.push(Number(getComputedStyle(label).opacity));
        if (performance.now() - start > 550) resolve(); else requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });
    return { positions: [...positions], widths: [...widths], fades };
  });
  await slider.press("End");
  const trace = await recording;
  expect(trace.positions.length).toBeGreaterThan(3);
  expect(trace.widths.length).toBeGreaterThan(3);
  expect(trace.fades.some((opacity) => opacity < 0.95)).toBe(true);
  await page.keyboard.press("Escape");
  await selectCirraMode(page, "Debugger");
  const label = trigger.locator("[data-cirra-selection]");
  await expect(label).toContainText("Debugger");
  expect(await label.evaluate((el) => getComputedStyle(el).animationName)).toBe("cirra-selection-fade");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await trigger.click();
  await slider.focus(); await slider.press("Home");
  // Global accessibility styles use a 0.01ms duration instead of literal zero.
  expect(await slider.evaluate((el) => parseFloat(getComputedStyle(el.parentElement!).transitionDuration))).toBeLessThanOrEqual(0.001);
  expect(await label.evaluate((el) => getComputedStyle(el).animationName)).toBe("none");
  await expect(slider).toHaveAttribute("aria-valuenow", "1");
});
