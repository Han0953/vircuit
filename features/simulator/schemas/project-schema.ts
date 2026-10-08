import { z } from "zod";
import { catalog, getDefinition } from "../catalog/registry";
import type { Project } from "../types/project";
import { normalizeRotation } from "../geometry/rotation";
const endpoint = z.object({ componentId: z.string().min(1).max(100), pinId: z.string().min(1).max(100) });
const position = z.object({ x: z.number().min(-100000).max(100000), y: z.number().min(-100000).max(100000) });
export const projectSchema = z.object({
  schemaVersion: z.literal(1), metadata: z.object({ name: z.string().max(200) }),
  components: z.array(z.object({ id: z.string().min(1).max(100), type: z.string().refine((type) => catalog.some((c) => c.key === type), "Komponen tidak dikenal"), label: z.string().max(200), position, rotation: z.number().min(0).max(359).default(0).transform((degrees): number => normalizeRotation(degrees)), properties: z.record(z.string().max(100), z.number().finite()) })).max(100),
  wires: z.array(z.object({ id: z.string().min(1).max(100), from: endpoint, to: endpoint, color: z.enum(["blue", "red", "green", "neutral"]) })).max(500),
  viewport: position.extend({ zoom: z.number().min(0.25).max(4) }),
  code: z.object({ language: z.literal("arduino-cpp-subset"), source: z.string().max(20000) }),
  settings: z.object({ boardId: z.string().nullable() }),
}).superRefine((p, ctx) => {
  const ids = [...p.components.map((c) => c.id), ...p.wires.map((w) => w.id)];
  if (new Set(ids).size !== ids.length) ctx.addIssue({ code: "custom", message: "ID komponen/kabel duplikat" });
  for (const w of p.wires) for (const end of [w.from, w.to]) {
    const c = p.components.find((c) => c.id === end.componentId);
    if (!c || !catalog.some((d) => d.key === c.type) || !getDefinition(c.type).pins.some((pin) => pin.id === end.pinId)) ctx.addIssue({ code: "custom", message: "Endpoint kabel tidak valid" });
  }
  if (p.settings.boardId && !p.components.some((c) => c.id === p.settings.boardId && ["uno", "nano", "esp32"].includes(c.type))) ctx.addIssue({ code: "custom", message: "Board aktif tidak valid" });
});
export function serializeProject(project: Project): string { return JSON.stringify(projectSchema.parse(project)); }
export function deserializeProject(raw: string): Project {
  if (raw.length > 2_000_000) throw new Error("Snapshot melebihi batas ukuran.");
  return projectSchema.parse(JSON.parse(raw));
}
