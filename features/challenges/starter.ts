import { practiceProject } from "@/features/learning/templates";
import type { Lesson } from "@/features/learning/schema";
export function challengeStarter(lesson: Lesson) {
  const project = practiceProject(lesson);
  project.metadata.name = `Tantangan: ${lesson.title}`;
  if (lesson.practice?.template === "debug") {
    project.wires[2].to.pinId = "D7";
  } else {
    project.code.source = "void setup(){\n  // Atur mode pin yang diperlukan.\n}\nvoid loop(){\n  // Lengkapi perilaku sesuai tujuan tantangan.\n  delay(100);\n}";
  }
  return project;
}
