import { z } from "zod";
import { learningId } from "@/features/learning/schema";
export const progressRowSchema = z.object({
  user_id: z.uuid(), course_id: learningId, lesson_id: learningId,
  status: z.enum(["in_progress", "completed"]), started_at: z.iso.datetime({ offset: true }), last_activity_at: z.iso.datetime({ offset: true }),
  completed_at: z.iso.datetime({ offset: true }).nullable(), completion_source: z.enum(["manual", "challenge"]).nullable(), verified_attempt_id: z.uuid().nullable(),
});
export type ProgressRow = z.infer<typeof progressRowSchema>;
export const learningEventSchema = z.strictObject({ lessonId: learningId, action: z.enum(["open", "complete"]) });
