import { z } from "zod";
import { projectSchema } from "../simulator/schemas/project-schema";
export const titleSchema = z.string().trim().min(1).max(200);
export const saveRequestSchema = z.object({
  id: z.uuid().nullable(), draftId: z.uuid(), operationId: z.uuid(),
  expectedRevision: z.number().int().nonnegative(),
  payload: projectSchema.refine((p) => titleSchema.safeParse(p.metadata.name).success, "Judul tidak valid"),
}).strict();
export type SaveRequest = z.infer<typeof saveRequestSchema>;
export const saveResultSchema = z.object({ id: z.uuid(), revision: z.number().int().positive() });
export const projectListSchema = z.array(z.object({ id: z.uuid(), title: titleSchema, revision: z.number().int().positive(), updated_at: z.string() }));
export const loadResultSchema = saveResultSchema.extend({ payload: projectSchema });
export type ProjectSummary = z.infer<typeof projectListSchema>[number];
export const projectQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  search: z.string().trim().max(200).default(""),
});
export const projectPageSchema = z.object({ items: projectListSchema, page: z.number().int().positive(), hasMore: z.boolean() });
export type ProjectPage = z.infer<typeof projectPageSchema>;
