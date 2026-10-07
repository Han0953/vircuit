export type PanelName = "left" | "right" | "bottom";
export type LayoutPreferences = Record<PanelName, { visible: boolean; size: number }>;
export const layoutStorageKey = "vircuit-workspace-layout-v1";
export const defaultLayout: LayoutPreferences = {
  left: { visible: true, size: 22 },
  right: { visible: true, size: 22 },
  bottom: { visible: true, size: 30 },
};

export function parseLayout(raw: string | null): LayoutPreferences {
  try {
    const value: unknown = JSON.parse(raw ?? "null");
    if (!value || typeof value !== "object") return defaultLayout;
    const result = structuredClone(defaultLayout);
    for (const name of ["left", "right", "bottom"] as const) {
      const panel: unknown = Reflect.get(value, name);
      if (!panel || typeof panel !== "object") continue;
      const size: unknown = Reflect.get(panel, "size");
      const visible: unknown = Reflect.get(panel, "visible");
      if (typeof size === "number" && Number.isFinite(size)) result[name].size = Math.max(15, Math.min(name === "bottom" ? 65 : 32, size));
      if (typeof visible === "boolean") result[name].visible = visible;
    }
    return result;
  } catch { return defaultLayout; }
}
