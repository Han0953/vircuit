import { findLesson } from "@/features/learning/registry";
import { challengeSchema, type Challenge, type Role } from "./contracts";

const items = [
  ["led-resistor", "Nyalakan LED", "LED menyala stabil melalui resistor seri.", "steady", ["Elektronika", "Wiring"]],
  ["blink", "Blink LED", "LED bergantian menyala dan padam selama minimal dua siklus.", "blink", ["Digital output", "Pemrograman"]],
  ["button", "Button Mengontrol LED", "LED menyala saat tombol ditekan dan padam saat dilepas.", "button", ["Digital input", "Pemrograman"]],
  ["pot", "Potentiometer Mengontrol Kecerahan", "Kecerahan LED meningkat mengikuti posisi potentiometer.", "pwm", ["Analog input", "PWM"]],
  ["debug", "Perbaiki Wiring dan Kode", "Perbaiki rangkaian dan kode hingga LED berkedip minimal dua siklus.", "blink", ["Debugging", "Wiring"]],
  ["traffic", "Traffic Light", "Nyalakan merah, hijau, kuning secara bergantian dan berulang tanpa lampu bersamaan.", "traffic", ["Digital output", "Pengembangan proyek"]],
] as const;

export function challengeCatalog(): Challenge[] {
  return items.map(([suffix, title, objective, scenario, skills], index) => {
    const lesson = findLesson(`lesson.${suffix}`)?.lesson;
    if (!lesson?.practice) throw new Error("Referensi practice challenge tidak tersedia.");
    const roles: Role[] = scenario === "traffic" ? ["board", "red_led", "yellow_led", "green_led"] : ["board", "led"];
    if (scenario === "button") roles.push("button");
    if (scenario === "pwm") roles.push("potentiometer");
    return challengeSchema.parse({
      id: `challenge.${suffix}`, version: 1, lessonId: lesson.id, practiceId: lesson.practice.id,
      title, objective, order: index + 1, skills, roles,
      requirements: [
        { id: "roles", type: "component_roles", message: "Komponen penilaian tersedia dan dipilih.", hint: "Pilih satu komponen berbeda untuk setiap peran." },
        { id: "circuit", type: "circuit_valid", message: "Rangkaian tidak memiliki error penghalang.", hint: "Periksa board, power, GND, serta Problems." },
        { id: "path", type: "electrical_path", message: "LED terhubung ke output dan GND melalui resistor seri tanpa bypass.", hint: "Periksa jalur output–resistor–anoda dan katoda–GND. Resistor tidak boleh dijembatani kabel." },
        { id: "program", type: "program_valid", message: "Program valid untuk subset runtime Vircuit.", hint: "Periksa sintaks, mode pin, dan API yang didukung." },
        { id: "behavior", type: "behavior_scenario", scenario, message: objective, hint: "Amati output sepanjang waktu dan sesuaikan program dengan tujuan; gunakan delay yang cukup singkat untuk pengujian 10 detik." },
      ],
    });
  });
}
export function findChallenge(id: string) { return challengeCatalog().find((c) => c.id === id); }
export function lessonChallenge(id: string) { return challengeCatalog().find((c) => c.lessonId === id); }
