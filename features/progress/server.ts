import "server-only";
import { authenticatedClient } from "@/features/projects/server/service";
import { progressWriter } from "@/lib/supabase/writer";
import { RequestError, limitedJson, requireSameOrigin } from "@/lib/request-security";
import { findLesson } from "@/features/learning/registry";
import { progressRowSchema, learningEventSchema, type ProgressRow } from "./contracts";

export async function readProgress(readOnly = false): Promise<ProgressRow[]> {
  const { client, user } = await authenticatedClient(readOnly);
  const { data, error } = await client.from("learning_progress").select("*").eq("user_id", user.id).order("lesson_id").limit(1000);
  if (error) throw new RequestError("Progress belum dapat dimuat. Coba lagi.", 503);
  return progressRowSchema.array().parse(data);
}
export async function progressForPage() {
  try { return { rows: await readProgress(true), error: null }; }
  catch (cause) {
    if (cause instanceof RequestError && cause.status === 401) throw cause;
    return { rows: null, error: "Progress belum dapat dimuat. Data completion belum ditampilkan." };
  }
}
export async function recordLearningEvent(request: Request) {
  requireSameOrigin(request);
  const { user } = await authenticatedClient();
  if (request.headers.get("x-vircuit-account") !== user.id) throw new RequestError("Session akun berubah. Buka kembali lesson dari akunmu.", 409);
  const input = learningEventSchema.safeParse(await limitedJson(request, 1024));
  if (!input.success) throw new RequestError("Event belajar tidak valid.", 400);
  const found = findLesson(input.data.lessonId);
  if (!found) throw new RequestError("Lesson tidak ditemukan.", 404);
  if (input.data.action === "complete" && found.lesson.practice) throw new RequestError("Lesson ini memerlukan tantangan terverifikasi.", 400);
  const { data, error } = await progressWriter().rpc("record_learning_event", {
    p_user_id: user.id, p_course_id: found.course.id, p_lesson_id: found.lesson.id, p_complete: input.data.action === "complete",
  });
  if (error) throw new RequestError("Progress belum tersimpan. Coba lagi.", 503);
  return progressRowSchema.parse(data);
}
