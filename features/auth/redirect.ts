import { z } from "zod";
import { findCourse, findLesson } from "@/features/learning/registry";
import { parsePracticeCommand } from "@/features/learning/practice-contract";
export function safeDestination(value: unknown): string {
  if (value === undefined || value === null || value === "") return "/dashboard";
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/simulator";
  try {
    const url = new URL(value, "https://vircuit.invalid");
    if (url.origin !== "https://vircuit.invalid") return "/simulator";
    if (["/dashboard", "/dashboard/projects", "/dashboard/challenges", "/dashboard/progress"].includes(url.pathname)) return url.pathname;
    if (url.pathname === "/dashboard/learn") return url.pathname;
    const learning = /^\/dashboard\/learn\/([a-z0-9-]+)(?:\/([a-z0-9-]+))?$/.exec(url.pathname);
    if (learning) {
      const course = findCourse(learning[1]);
      return course && (!learning[2] || course.lessons.some((l) => l.slug === learning[2])) ? url.pathname : "/dashboard/learn";
    }
    if (url.pathname !== "/simulator") return "/simulator";
    const practice = parsePracticeCommand(url.search);
    if (practice) return findLesson(practice.lessonId)?.lesson.practice ? `/simulator?${new URLSearchParams({ lesson: practice.lessonId, practice: practice.intent, ...(practice.challenge ? { challenge: "1" } : {}) })}` : "/simulator";
    const draft = url.searchParams.get("draft");
    if (url.searchParams.get("save") === "1" && z.uuid().safeParse(draft).success) return `/simulator?save=1&draft=${draft}`;
    const project = url.searchParams.get("project");
    if (z.uuid().safeParse(project).success) return `/simulator?project=${project}`;
    const intent = url.searchParams.get("new");
    if (z.uuid().safeParse(intent).success) return `/simulator?new=${intent}`;
    return "/simulator";
  } catch { return "/simulator"; }
}
