import type { LucideIcon } from "lucide-react";
import {
  CloudSun,
  DoorClosed,
  Egg,
  House,
  LampDesk,
  Leaf,
  Thermometer,
  TrafficCone,
  Wind,
} from "lucide-react";

/** Difficulty tier for progressive learning curricula */
export type ProjectLevel = "Beginner" | "Intermediate" | "Advanced";

/**
 * Metadata definition for marketing project cards.
 * Used across the homepage showcase and the full `/jelajahi` project directory.
 */
export type ProjectPreview = {
  /** Unique URL-friendly slug */
  slug: string;
  /** Human-readable title */
  name: string;
  /** Curriculum difficulty level */
  level: ProjectLevel;
  /** Lucide icon representing the project subject */
  icon: LucideIcon;
  /** Short topic label (e.g., "Urutan & waktu") */
  topic: string;
  /** Concise project summary */
  text: string;
  /** Core IoT/electronics concepts practiced in this project */
  concepts: readonly string[];
};

/**
 * Curated catalog of educational projects based on PRD.md (LEARN-4, LEARN-5) and DESIGN.md (19.7).
 *
 * Note on Architecture:
 * This static dataset serves purely as a marketing preview for Milestone 1.
 * When backend project persistence (VIR-120+) is implemented, template definitions
 * will be fetched via server-side API while maintaining this UI contract.
 */
export const projectCatalog: readonly ProjectPreview[] = [
  // Beginner Tier: Focuses on single actuators, basic digital/analog I/O, and simple delay logic
  {
    slug: "traffic-light",
    name: "Traffic Light",
    level: "Beginner",
    icon: TrafficCone,
    topic: "Urutan & waktu",
    text: "Pelajari urutan nyala LED dan pengaturan jeda waktu.",
    concepts: ["Digital output", "delay()", "LED"],
  },
  {
    slug: "smart-lamp",
    name: "Smart Lamp",
    level: "Beginner",
    icon: LampDesk,
    topic: "Input & kontrol",
    text: "Hubungkan pembacaan cahaya dengan kendali lampu otomatis.",
    concepts: ["Analog input", "Kondisi if-else", "LED"],
  },
  {
    slug: "digital-thermometer",
    name: "Digital Thermometer",
    level: "Beginner",
    icon: Thermometer,
    topic: "Sensor & display",
    text: "Baca data suhu dan pahami cara menampilkannya pada monitor.",
    concepts: ["Sensor suhu", "Display", "Serial Monitor"],
  },

  // Intermediate Tier: Combines multiple sensors with actuators and state logic
  {
    slug: "smart-plant-monitoring",
    name: "Smart Plant Monitoring",
    level: "Intermediate",
    icon: Leaf,
    topic: "Monitoring kondisi",
    text: "Pantau kelembapan tanah dan tentukan kapan penyiraman diperlukan.",
    concepts: ["Sensor kelembapan", "Ambang batas", "Aktuator pompa"],
  },
  {
    slug: "smart-door",
    name: "Smart Door",
    level: "Intermediate",
    icon: DoorClosed,
    topic: "Input & aktuator",
    text: "Rancang logika kunci pintu otomatis menggunakan servo dan tombol.",
    concepts: ["Button", "Servo motor", "State tracking"],
  },
  {
    slug: "weather-station",
    name: "Weather Station",
    level: "Intermediate",
    icon: CloudSun,
    topic: "Data lingkungan",
    text: "Kenali pembacaan suhu dan kelembapan dalam satu sistem terpadu.",
    concepts: ["Suhu & kelembapan", "Display I2C", "Interval baca"],
  },

  // Advanced Tier: Multi-component automation, feedback control loops, and capstones
  {
    slug: "smart-home",
    name: "Smart Home",
    level: "Advanced",
    icon: House,
    topic: "Integrasi sistem",
    text: "Gabungkan sensor gerak, suhu, dan relay dalam konsep otomasi hunian.",
    concepts: ["Multi-sensor", "Relay AC/DC", "Logika otomasi"],
  },
  {
    slug: "environmental-monitoring",
    name: "Environmental Monitoring",
    level: "Advanced",
    icon: Wind,
    topic: "Sistem telemetri",
    text: "Susun sistem yang memantau beberapa parameter lingkungan secara berkala.",
    concepts: ["Multi-sensor", "Serial logging", "Validasi sinyal"],
  },
  {
    slug: "iot-egg-incubator",
    name: "IoT Egg Incubator",
    level: "Advanced",
    icon: Egg,
    topic: "Capstone Project",
    text: "Rangkai pemahaman sensor, kontrol suhu histeresis, display, relay, dan kipas dalam konsep inkubator telur cerdas.",
    concepts: ["ESP32", "DHT22 Suhu/Kelembapan", "Relay & Kipas"],
  },
];

/**
 * Metadata and descriptions for the three curriculum difficulty tiers.
 */
export const projectLevels: ReadonlyArray<{
  level: ProjectLevel;
  label: string;
  description: string;
}> = [
  {
    level: "Beginner",
    label: "Tingkat Dasar",
    description: "Pengenalan digital I/O, sinyal PWM, LED, dan pembacaan sensor sederhana.",
  },
  {
    level: "Intermediate",
    label: "Tingkat Menengah",
    description: "Kombinasi sensor lingkungan, servo motor, dan display informasi.",
  },
  {
    level: "Advanced",
    label: "Tingkat Lanjutan",
    description: "Integrasi multi-aktuator, kontrol feedback, dan proyek capstone berbasis ESP32.",
  },
];
