import { learningCatalog, lessonHref } from "@/features/learning/registry";
import { lessonChallenge } from "@/features/challenges/registry";
import type { ProgressRow } from "./contracts";

export function deriveProgress(rows: ProgressRow[]) {
  const catalog = learningCatalog();
  const lessons = catalog.flatMap((course) => course.lessons.map((lesson) => ({ course, lesson })));
  const progress = new Map(rows.filter((row) => lessons.some(({ course, lesson }) => row.course_id === course.id && row.lesson_id === lesson.id)).map((row) => [row.lesson_id, row]));
  const completed = (id: string) => progress.get(id)?.status === "completed";
  const count = (ids: string[]) => ({ completed: ids.filter(completed).length, total: ids.length });
  const courses = catalog.map((course) => ({ course, ...count(course.lessons.map((l) => l.id)), modules: course.modules.map((module) => ({ module, ...count(course.lessons.filter((l) => l.moduleId === module.id).map((l) => l.id)) })) }));
  const topics = new Map<string, string[]>();
  for (const { lesson } of lessons) for (const skill of lessonChallenge(lesson.id)?.skills ?? ["Elektronika"]) topics.set(skill, [...(topics.get(skill) ?? []), lesson.id]);
  const skills = [...topics.entries()].map(([name, ids]) => ({ name, ...count(ids) }));
  const active = lessons.filter(({ lesson }) => progress.get(lesson.id)?.status === "in_progress");
  active.sort((a, b) => {
    const date = Date.parse(progress.get(b.lesson.id)!.last_activity_at) - Date.parse(progress.get(a.lesson.id)!.last_activity_at);
    return date || lessons.indexOf(a) - lessons.indexOf(b);
  });
  const next = active[0] ?? lessons.find(({ lesson }) => !completed(lesson.id)) ?? lessons[0];
  const allComplete = lessons.every(({ lesson }) => completed(lesson.id));
  return { courses, skills, progress, ...count(lessons.map(({ lesson }) => lesson.id)), continueLearning: { ...next, href: lessonHref(next.course, next.lesson), review: allComplete } };
}
