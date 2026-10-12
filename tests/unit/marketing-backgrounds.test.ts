import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { backgroundScenes, type BackgroundScene } from "../../components/marketing/backgrounds/background-scenes";
import { SectionBackground } from "../../components/marketing/backgrounds/section-background";

describe("marketing background artwork", () => {
  it("renders complete inert artwork for every authored scene without browser APIs", () => {
    for (const scene of Object.keys(backgroundScenes) as BackgroundScene[]) {
      const html = renderToStaticMarkup(createElement(SectionBackground, { scene }));
      expect(html).toContain(`data-marketing-background="${scene}"`);
      expect(html).toContain('aria-hidden="true"');
      expect(html).not.toMatch(/<canvas|<button|<a\s|tabindex|undefined|NaN/i);
      expect(html).not.toContain('stroke-dashoffset="1"');
    }
  });

  it("leaves the existing feature and roadmap controllers as the only story owners", () => {
    expect(backgroundScenes["features-story"].owner).toBe("features");
    expect(backgroundScenes["learn-roadmap"].owner).toBe("roadmap");
    expect(renderToStaticMarkup(createElement(SectionBackground, { scene: "home-story" }))).not.toContain("<svg");
  });
});
