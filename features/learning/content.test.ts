import { expect, it } from "vitest";
import { learningCatalog, findLesson, validateCatalog, lessonHref } from "./registry";
import { practiceProject } from "./templates";
import { SimulationEngine } from "@/features/simulator/runtime/engine";

it("validates seven ordered lessons with stable identifiers and prerequisites", () => {
  const [course] = learningCatalog();
  expect(course.lessons).toHaveLength(7); expect(course.modules).toHaveLength(4);
  expect(course.lessons.map((l) => l.order)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  expect(lessonHref(course, course.lessons[2])).toBe("/dashboard/learn/dasar-iot/blink");
  expect(() => validateCatalog([course, course])).toThrow(/duplikat/);
  expect(() => validateCatalog([course, { ...course, id: "course.other", slug: "other", order: 2 }])).toThrow(/ID learning duplikat/);
  expect(() => validateCatalog([{ ...course, lessons: [{ ...course.lessons[0], moduleId: "missing" }] }])).toThrow();
  expect(findLesson("unknown")).toBeNull();
});
it("all starter templates remain compatible with snapshot v1 and supported runtime", () => {
  for (const lesson of learningCatalog()[0].lessons.filter((l) => l.practice)) {
    const project = practiceProject(lesson);
    expect(project.schemaVersion).toBe(1);
    if (lesson.practice?.template !== "led-wiring") expect(() => new SimulationEngine(project).step()).not.toThrow();
  }
});
it("Blink, button input and analog/PWM actually respond", () => {
  const blink = new SimulationEngine(practiceProject(findLesson("lesson.blink")!.lesson));
  expect(blink.step().outputs.led).toBe(1); expect(blink.step().outputs.led).toBe(0);
  const button = new SimulationEngine(practiceProject(findLesson("lesson.button")!.lesson));
  expect(button.step().outputs.led).toBe(0); button.input("button", "pressed", 1); button.step();
  expect(button.step().outputs.led).toBe(1);
  const pot = new SimulationEngine(practiceProject(findLesson("lesson.pot")!.lesson));
  pot.input("pot", "value", 0); pot.step(); expect(pot.step().outputs.led).toBe(0);
  pot.input("pot", "value", 100); pot.step(); expect(pot.step().outputs.led).toBe(1);
});
it("Traffic Light supports the reference sequence when the learner completes the code", () => {
  const project = practiceProject(findLesson("lesson.traffic")!.lesson);
  project.code.source = "void setup(){pinMode(3,OUTPUT);pinMode(5,OUTPUT);pinMode(6,OUTPUT);}\nvoid loop(){digitalWrite(3,HIGH);digitalWrite(5,LOW);digitalWrite(6,LOW);delay(1000);digitalWrite(3,LOW);digitalWrite(6,HIGH);delay(1000);digitalWrite(6,LOW);digitalWrite(5,HIGH);delay(500);}";
  const e = new SimulationEngine(project);
  expect(e.step().outputs).toMatchObject({ led: 1, yellow: 0, green: 0 });
  expect(e.step().outputs).toMatchObject({ led: 0, yellow: 0, green: 1 });
  expect(e.step().outputs).toMatchObject({ led: 0, yellow: 1, green: 0 });
});
