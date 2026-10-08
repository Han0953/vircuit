import { expect, it } from "vitest";
import { directions, type Route } from "./types";
import { previewRoute, simplify } from "./route-geometry";

export function expectOrthogonal(route: Route) {
  for (let i = 0; i < route.points.length; i++) {
    const point = route.points[i];
    expect(Number.isFinite(point.x) && Number.isFinite(point.y)).toBe(true);
    if (i) expect(point.x === route.points[i - 1].x || point.y === route.points[i - 1].y).toBe(true);
  }
}

it("keeps exact endpoints with orthogonal previews for every port direction", () => {
  for (const side of directions) for (const targetSide of directions) {
    const source = { x: -123.5, y: 80, side }, target = { x: 99000, y: -500, side: targetSide };
    const route = previewRoute(source, target);
    expectOrthogonal(route);
    expect(route.points[0]).toEqual({ x: source.x, y: source.y });
    expect(route.points.at(-1)).toEqual({ x: target.x, y: target.y });
    expect(previewRoute(source, target)).toEqual(route);
  }
});

it("removes redundant segments while preserving intentional U turns and coincident pins", () => {
  expect(simplify([{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }])).toEqual([{ x: 0, y: 0 }, { x: 2, y: 0 }]);
  expect(simplify([{ x: 0, y: 0 }, { x: 12, y: 0 }, { x: 1, y: 0 }])).toHaveLength(3);
  expect(previewRoute({ x: 3, y: 5, side: "left" }, { x: 3, y: 5, side: "right" }).status).toBe("coincident");
});
