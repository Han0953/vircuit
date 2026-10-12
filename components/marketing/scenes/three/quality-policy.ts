export type HardwareQuality = "high" | "medium" | "low";
export function chooseHardwareQuality({ cores = 4, memory = 4, saveData = false }: { cores?: number; memory?: number; saveData?: boolean }): HardwareQuality {
  if (saveData || cores <= 2 || memory <= 2) return "low";
  return cores >= 8 && memory >= 8 ? "high" : "medium";
}
export function nextHardwareQuality(quality: HardwareQuality) {
  return quality === "high" ? "medium" : quality === "medium" ? "low" : "fallback";
}
export function qualityDpr(quality: HardwareQuality, deviceDpr: number) {
  return Math.min(deviceDpr, quality === "high" ? 1.5 : quality === "medium" ? 1.25 : .75);
}
export function framedFov(base: number, aspect: number, reference = .85) {
  return Math.min(60, 2 * Math.atan(Math.tan(base * Math.PI / 360) * Math.max(1, reference / Math.max(.25, aspect))) * 180 / Math.PI);
}
