export type Rotation = 0 | 90 | 180 | 270;

export function normalizeRotation(degrees: number): Rotation {
  if (!Number.isFinite(degrees)) return 0;
  const quarter = ((Math.round(degrees / 90) % 4) + 4) % 4;
  return ([0, 90, 180, 270] as const)[quarter];
}

export function rotatePoint(point: { x: number; y: number }, width: number, height: number, degrees: number) {
  switch (normalizeRotation(degrees)) {
    case 90: return { x: height - point.y, y: point.x };
    case 180: return { x: width - point.x, y: height - point.y };
    case 270: return { x: point.y, y: width - point.x };
    default: return { x: point.x, y: point.y };
  }
}
