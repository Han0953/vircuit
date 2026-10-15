import { expect, type Page } from "@playwright/test";

export async function selectCirraMode(page: Page, label: string) {
  await page.getByRole("button", { name: "Pengaturan Cirra", exact: true }).click();
  const panel = page.getByRole("dialog", { name: "Pengaturan Cirra", exact: true });
  await panel.getByRole("button", { name: /^Ganti mode:/ }).click();
  await panel.getByRole("radio", { name: label, exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
}

export async function selectCirraEffort(page: Page, level: number) {
  await page.getByRole("button", { name: "Pengaturan Cirra", exact: true }).click();
  const slider = page.getByRole("slider", { name: "Effort bantuan", exact: true });
  await slider.focus();
  await slider.press("Home");
  for (let step = 1; step < level; step++) await slider.press("ArrowRight");
  await expect(slider).toHaveAttribute("aria-valuenow", String(level));
  await page.keyboard.press("Escape");
}
