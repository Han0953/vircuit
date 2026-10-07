import { z } from "zod";
import { projectSchema } from "@/features/simulator/schemas/project-schema";
import { learningId, learningContextSchema } from "./schema";
export const practiceCommandSchema = z.object({ lessonId: learningId, intent: z.uuid() });
export type PracticeCommand = z.infer<typeof practiceCommandSchema>;
export const practiceResultSchema = z.object({ owner: z.uuid(), context: learningContextSchema, project: projectSchema });
export function parsePracticeCommand(query: string): PracticeCommand | null {
  const params = new URLSearchParams(query);
  if (!params.has("lesson") && !params.has("practice")) return null;
  if (["new", "project", "save", "draft"].some((key) => params.has(key)) || params.getAll("lesson").length !== 1 || params.getAll("practice").length !== 1) throw new Error("Tautan praktik tidak valid.");
  const parsed = practiceCommandSchema.safeParse({ lessonId: params.get("lesson"), intent: params.get("practice") });
  if (!parsed.success) throw new Error("Tautan praktik tidak valid.");
  return parsed.data;
}
