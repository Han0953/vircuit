import { CloudSun, Egg, House, LampDesk, Thermometer, TrafficCone } from "lucide-react";
import { SectionHeading } from "./section-heading";

const projects = [
  { icon: TrafficCone, name: "Traffic Light", topic: "Urutan & waktu", text: "Pelajari urutan nyala LED dan pengaturan jeda." },
  { icon: LampDesk, name: "Smart Lamp", topic: "Input & kontrol", text: "Hubungkan pembacaan cahaya dengan kendali lampu." },
  { icon: Thermometer, name: "Digital Thermometer", topic: "Sensor & display", text: "Baca data suhu dan pahami cara menampilkannya." },
  { icon: CloudSun, name: "Weather Station", topic: "Data lingkungan", text: "Kenali pembacaan suhu dan kelembapan dalam satu sistem." },
  { icon: House, name: "Smart Home", topic: "Integrasi komponen", text: "Gabungkan sensor dan aktuator dalam konsep rumah otomatis." },
];

export function ProjectShowcaseSection() {
  return (
    <section id="jelajahi" tabIndex={-1} aria-labelledby="projects-heading" className="scroll-mt-8 border-t bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-8 lg:py-24">
        <SectionHeading id="projects-heading" eyebrow="06 / Project Showcase" title="Konsep yang dipelajari. Ide yang bisa dibangun." description="Pilihan project yang direncanakan untuk menjembatani latihan dasar dan sistem IoT yang lebih kompleks. Katalog ini merupakan pratinjau, belum dapat dibuka sebagai project." />
        <div className="mt-10 grid gap-8 lg:grid-cols-3">
          <ul className="divide-y border-y lg:col-span-2">
            {projects.map(({ icon: Icon, name, topic, text }) => (
              <li key={name} className="flex items-start gap-4 py-6 sm:gap-6">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-md border bg-background"><Icon className="size-6" aria-hidden="true" /></span>
                <div className="min-w-0 flex-1"><div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1"><h3 className="text-lg font-semibold">{name}</h3><p className="font-mono text-xs text-text-secondary">{topic}</p></div><p className="mt-2 text-sm leading-relaxed text-text-secondary">{text}</p></div>
              </li>
            ))}
          </ul>
          <article className="flex flex-col rounded-lg border bg-background p-6 sm:p-8">
            <p className="font-mono text-xs tracking-widest text-text-secondary uppercase">Project akhir / Lanjutan</p>
            <div className="my-8 flex min-h-40 items-center justify-center rounded-md border border-dashed bg-surface-muted"><Egg className="size-20 text-primary" strokeWidth={1} aria-hidden="true" /></div>
            <h3 className="text-h3 font-semibold tracking-tight">IoT Egg Incubator</h3>
            <p className="mt-4 text-sm leading-relaxed text-text-secondary">Rangkai pemahaman sensor, kontrol suhu, display, relay, dan kipas dalam konsep inkubator telur virtual.</p>
            <p className="mt-auto pt-8 font-mono text-xs text-text-secondary">Sensor → Logika kontrol → Aktuator</p>
          </article>
        </div>
      </div>
    </section>
  );
}
