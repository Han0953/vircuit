import { expect, test, type Page } from "@playwright/test";
import { fixture } from "../../features/simulator/tests/fixtures";
import type { Project } from "../../features/simulator/types/project";

async function saved(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => { const r = indexedDB.open("vircuit-projects", 1); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
    try { return await new Promise<Project>((resolve, reject) => { const r = db.transaction("drafts").objectStore("drafts").get("guest"); r.onsuccess = () => resolve(r.result.project); r.onerror = () => reject(r.error); }); }
    finally { db.close(); }
  });
}

test("a 100-component gesture preserves wires, code, Undo/Redo and reload recovery", async ({ page }) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/simulator");
  const project = fixture(Object.fromEntries(Array.from({ length: 100 }, (_, i) => [`c${i}`, "resistor"])), [["c0.2", "c1.1"]], "void setup(){}void loop(){}");
  project.components.forEach((c, i) => { c.position = { x: i % 10 * 180, y: Math.floor(i / 10) * 100 + 50 }; });
  await page.getByRole("button", { name: "Buka menu proyek" }).click();
  await page.getByLabel("Impor JSON", { exact: true }).setInputFiles({ name: "group.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(project)) });
  await page.keyboard.press("Escape");
  await expect(page.locator(".react-flow__node")).toHaveCount(100);
  await expect.poll(async () => (await saved(page)).components).toEqual(project.components);
  await page.getByTestId("circuit-canvas").focus(); await page.keyboard.press("Control+a");
  const body = page.locator('.react-flow__node[data-id="c0"] [data-testid="component-body"]');
  const b = (await body.boundingBox())!;
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2 + 60, b.y + b.height / 2 + 40, { steps: 8 }); await page.mouse.up();
  await expect.poll(async () => (await saved(page)).components.filter((c, i) => c.position.x !== project.components[i].position.x || c.position.y !== project.components[i].position.y).length).toBe(100);
  const moved = await saved(page);
  expect(moved.wires).toEqual(project.wires); expect(moved.code).toEqual(project.code);
  await page.getByTestId("circuit-canvas").focus(); await page.keyboard.press("Control+z");
  await expect.poll(async () => (await saved(page)).components).toEqual(project.components);
  await page.keyboard.press("Control+Shift+z");
  await expect.poll(async () => (await saved(page)).components).toEqual(moved.components);
  await page.reload(); await expect(page.locator(".react-flow__node")).toHaveCount(100);
  expect((await saved(page)).components).toEqual(moved.components);
});
