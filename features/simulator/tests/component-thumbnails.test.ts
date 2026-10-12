import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { catalog } from "../catalog/registry";
import { visualLayout } from "../ui/visuals/pin-layout";
import { ComponentThumbnail } from "../ui/visuals/component-thumbnail";

it("every library thumbnail reuses canvas bounds and actual pin geometry", () => {
  for (const definition of catalog) {
    const layout = visualLayout(definition);
    const html = renderToStaticMarkup(createElement(ComponentThumbnail, { definition }));
    expect(html).toContain(`viewBox="0 0 ${layout.width} ${layout.height}"`);
    expect(html).not.toMatch(/undefined|NaN/);
    if (definition.groups) expect(html.match(/h6v6h-6Z/g)).toHaveLength(definition.pins.length);
    else for (const pin of definition.pins) expect(html).toContain(`data-visual-pin="${pin.id}"`);
  }
});
