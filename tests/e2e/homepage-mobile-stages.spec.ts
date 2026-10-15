import { expect, test, type Locator, type Page } from "@playwright/test";

async function seek(page: Page, kind: "story" | "boards", progress: number) {
  await page.evaluate(({ kind, progress }) => {
    const container = document.querySelector<HTMLElement>(kind === "story" ? "[data-story]" : "[data-board-showcase]")!;
    const stage = container.querySelector<HTMLElement>(kind === "story" ? "[data-stage]" : "[data-board-stage]")!;
    const header = document.querySelector<HTMLElement>("[data-home-header]")!.offsetHeight;
    scrollTo(0, container.getBoundingClientRect().top + scrollY - header - 16 + (container.offsetHeight - stage.offsetHeight) * progress);
  }, { kind, progress });
}

async function contained(content: Locator, stage: Locator) {
  const inner = (await content.boundingBox())!, outer = (await stage.boundingBox())!;
  expect(inner.x).toBeGreaterThanOrEqual(outer.x);
  expect(inner.y).toBeGreaterThanOrEqual(outer.y);
  expect(inner.x + inner.width).toBeLessThanOrEqual(outer.x + outer.width + 1);
  expect(inner.y + inner.height).toBeLessThanOrEqual(outer.y + outer.height + 1);
}

for (const [width, height, theme] of [[360, 844, "light"], [360, 640, "light"], [390, 844, "light"], [390, 844, "dark"], [430, 844, "dark"], [768, 844, "light"]] as const) {
  test(`mobile 3D stages contain one explanation and follow reverse scroll: ${width}x${height} ${theme}`, async ({ page }, info) => {
    test.setTimeout(90000);
    await page.setViewportSize({ width, height });
    await page.addInitScript((value) => localStorage.setItem("vircuit-theme", value), theme);
    await page.goto("/");
    const scene = page.locator('[data-scene="story"]');
    await expect(scene).toHaveAttribute("data-motion", "story");
    const storyStage = page.locator("[data-stage]");
    for (const [progress, step] of [[.02, 1], [.35, 2], [.62, 3], [.92, 4], [.35, 2]] as const) {
      await seek(page, "story", progress);
      await expect(scene).toHaveAttribute("data-beat", String(step));
      const details = page.locator('[data-stage-details="story"]');
      await expect(details.getByRole("heading", { level: 3 })).toHaveCount(1);
      await expect(details.locator("[data-beat]").nth(step - 1)).toHaveCSS("opacity", "1");
      await expect(details.getByRole("heading", { level: 3 })).toHaveCSS("opacity", "1");
      await contained(details, storyStage);
      await contained(scene.locator("figcaption"), storyStage);
      await expect(page.locator('[data-frame]:visible')).toHaveCount(0);
      const picture = scene.locator('[data-renderer]');
      await expect(picture).toHaveAttribute("data-renderer", "webgl", { timeout: 20000 });
      const image = (await picture.boundingBox())!, copy = (await details.boundingBox())!;
      expect(image.y + image.height).toBeLessThanOrEqual(copy.y);
      await expect(page.locator("canvas")).toHaveCount(1);
      if (step === 3) await page.screenshot({ path: info.outputPath("learning-stage.png") });
    }
    const boardStage = page.locator("[data-board-stage]");
    for (const [progress, board] of [[.15, "uno"], [.5, "nano"], [.84, "esp32"], [.15, "uno"]] as const) {
      await seek(page, "boards", progress);
      await expect(page.locator("[data-board-showcase]")).toHaveAttribute("data-active-board", board);
      const details = page.locator('[data-stage-details="boards"]');
      await expect(details.getByRole("heading", { level: 3 })).toHaveCount(1);
      await expect(details.locator(`[data-featured-board="${board}"]`)).toBeVisible();
      await expect(details.locator(`[data-featured-board="${board}"]`)).toHaveCSS("opacity", "1");
      await expect(details.getByRole("heading", { level: 3 })).toHaveCSS("opacity", "1");
      await contained(details, boardStage);
      await expect(boardStage.locator("figcaption")).toBeHidden();
      const picture = boardStage.locator('[data-cinematic-slot="boards"]');
      await expect(picture).toHaveAttribute("data-renderer", "webgl", { timeout: 20000 });
      const image = (await picture.boundingBox())!, copy = (await details.boundingBox())!;
      expect(image.y + image.height).toBeLessThanOrEqual(copy.y);
      await expect(page.locator("canvas")).toHaveCount(1);
      await page.screenshot({ path: info.outputPath(`${board}-stage.png`) });
    }
    for (const stage of [storyStage, boardStage]) {
      const height = await stage.evaluate((element) => element.getBoundingClientRect().height);
      const header = await page.locator("[data-home-header]").evaluate((element) => element.getBoundingClientRect().height);
      expect(height).toBeCloseTo(page.viewportSize()!.height - header - 34, 0);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  });
}

test("mobile static stages keep all content inside the same figure without JS or reduced motion", async ({ browser }) => {
  for (const javaScriptEnabled of [false, true]) {
    const context = await browser.newContext({ javaScriptEnabled, reducedMotion: "reduce", viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto("/");
    const story = page.locator('[data-home-zone="story"] figure');
    const boards = page.locator('[data-home-zone="boards"] figure');
    await expect(story.getByRole("heading", { level: 3 })).toHaveCount(4);
    await expect(boards.getByRole("heading", { level: 3 })).toHaveCount(3);
    for (const group of [story, boards]) {
      for (const heading of await group.getByRole("heading", { level: 3 }).all()) await expect(heading).toBeVisible();
      await contained(group.locator("[data-stage-details]"), group);
    }
    await expect(page.locator("canvas")).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await context.close();
  }
});
