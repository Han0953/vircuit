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

export type ProjectLevel = "Beginner" | "Intermediate" | "Advanced";

export type ProjectPreview = {
  slug: string;
  name: string;
  level: ProjectLevel;
  icon: LucideIcon;
  topic: string;
  text: string;
  concepts: readonly string[];
};

export const projectCatalog: readonly ProjectPreview[] = [
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
