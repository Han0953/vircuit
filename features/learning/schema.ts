import { z } from "zod";
export const learningId = z.string().regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/).max(100);
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80);
const text = z.string().min(1);
export const blockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("paragraph"), text }),
  z.object({ type: z.literal("heading"), text }),
  z.object({ type: z.literal("list"), items: z.array(text).min(1) }),
  z.object({ type: z.literal("callout"), title: text, text }),
  z.object({ type: z.literal("code"), source: text }),
  z.object({ type: z.literal("diagram"), steps: z.array(text).min(2), caption: text }),
]);
export const practiceSchema = z.object({
  id: learningId, template: z.enum(["led-wiring", "blink", "button", "pot", "debug", "traffic"]),
  version: z.number().int().positive(), goal: text, components: z.array(text).min(1),
  instructions: z.array(z.object({ phase: z.enum(["Build", "Wire", "Code", "Simulate", "Debug"]), text })).min(1),
  observations: z.array(text).min(1),
});
const lessonSchema = z.object({
  id: learningId, slug, title: text, summary: text, moduleId: learningId,
  order: z.number().int().positive(), duration: z.number().int().positive(),
  objectives: z.array(text).min(1), prerequisites: z.array(learningId),
  blocks: z.array(blockSchema).min(1), concepts: z.array(text).min(1), practice: practiceSchema.nullable(),
});
export const courseSchema = z.object({
  id: learningId, slug, title: text, description: text, level: z.literal("beginner"),
  order: z.number().int().positive(), version: z.number().int().positive(), published: z.boolean(),
  modules: z.array(z.object({ id: learningId, title: text, order: z.number().int().positive() })).min(1),
  lessons: z.array(lessonSchema).min(1),
}).superRefine((course, ctx) => {
  const unique = (values: (string | number)[], label: string) => {
    if (new Set(values).size !== values.length) ctx.addIssue({ code: "custom", message: `${label} harus unik` });
  };
  unique([...course.modules.map((m) => m.id), ...course.lessons.map((l) => l.id), ...course.lessons.flatMap((l) => l.practice ? [l.practice.id] : [])], "ID");
  unique(course.modules.map((m) => m.order), "Urutan module");
  unique(course.lessons.map((l) => l.slug), "Slug lesson");
  unique(course.lessons.map((l) => l.order), "Urutan lesson");
  for (const lesson of course.lessons) {
    if (!course.modules.some((m) => m.id === lesson.moduleId)) ctx.addIssue({ code: "custom", message: "Module tidak ditemukan" });
    for (const id of lesson.prerequisites) if (!course.lessons.some((l) => l.id === id && l.order < lesson.order)) ctx.addIssue({ code: "custom", message: "Prerequisite harus lesson sebelumnya" });
  }
});
export type Course = z.infer<typeof courseSchema>;
export type Lesson = Course["lessons"][number];
export type ContentBlock = z.infer<typeof blockSchema>;
export const learningContextSchema = z.object({ lessonId: learningId, practiceId: learningId, templateVersion: z.number().int().positive(), intent: z.uuid(), challengeId: learningId.optional(), challengeVersion: z.number().int().positive().optional(), phase: z.enum(["practice", "challenge", "evaluation"]).optional() });
export type LearningContext = z.infer<typeof learningContextSchema>;
