import { authenticatedClient } from "@/features/projects/server/service";
import { RequestError, errorResponse } from "@/lib/request-security";
import { parsePracticeCommand } from "@/features/learning/practice-contract";
import { findLesson } from "@/features/learning/registry";
import { practiceProject } from "@/features/learning/templates";
import { lessonChallenge } from "@/features/challenges/registry";
import { challengeStarter } from "@/features/challenges/starter";
export async function GET(request: Request) {
  try {
    const { user } = await authenticatedClient();
    let command;
    try { command = parsePracticeCommand(new URL(request.url).search); } catch { throw new RequestError("Tautan praktik tidak valid.", 400); }
    const found = command && findLesson(command.lessonId);
    if (!command || !found?.lesson.practice) throw new RequestError("Praktik tidak ditemukan.", 404);
    const practice = found.lesson.practice;
    const challenge = command.challenge ? lessonChallenge(found.lesson.id) : undefined;
    const project = challenge ? challengeStarter(found.lesson) : practiceProject(found.lesson);
    return Response.json({ owner: user.id, context: { lessonId: found.lesson.id, practiceId: practice.id, templateVersion: practice.version, intent: command.intent, phase: challenge ? "challenge" : "practice", ...(challenge ? { challengeId: challenge.id, challengeVersion: challenge.version } : {}) }, project }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return errorResponse(error); }
}
