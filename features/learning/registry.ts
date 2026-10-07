import authored from "./content/dasar-iot.json";
import { courseSchema, type Course } from "./schema";
export function validateCatalog(content: unknown[]): Course[] {
  const courses = content.map((item) => courseSchema.parse(item));
  for (const key of ["id", "slug", "order"] as const) if (new Set(courses.map((c) => c[key])).size !== courses.length) throw new Error(`Course ${key} duplikat`);
  const ids = courses.flatMap((c) => [c.id, ...c.modules.map((m) => m.id), ...c.lessons.map((l) => l.id), ...c.lessons.flatMap((l) => l.practice ? [l.practice.id] : [])]);
  if (new Set(ids).size !== ids.length) throw new Error("ID learning duplikat");
  return courses.map((c) => ({ ...c, modules: [...c.modules].sort((a, b) => a.order - b.order), lessons: [...c.lessons].sort((a, b) => a.order - b.order) })).sort((a, b) => a.order - b.order);
}
export function learningCatalog() { return validateCatalog([authored]).filter((c) => c.published); }
export function findCourse(slug: string) { return learningCatalog().find((c) => c.slug === slug); }
export function findLesson(id: string) {
  for (const course of learningCatalog()) {
    const lesson = course.lessons.find((l) => l.id === id);
    if (lesson) return { course, lesson };
  }
  return null;
}
export function lessonHref(course: Course, lesson: Course["lessons"][number]) { return `/dashboard/learn/${course.slug}/${lesson.slug}`; }
