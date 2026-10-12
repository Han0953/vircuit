import { getDefinition } from "@/features/simulator/catalog/registry";
import { visualLayout } from "@/features/simulator/ui/visuals/pin-layout";
import { ComponentVisual } from "@/features/simulator/ui/visuals/component-visual";
import { SectionHeading } from "../section-heading";
import { SectionBackground } from "../backgrounds/section-background";
import { SectionLink } from "../section-link";
import { CinematicSlot } from "./cinematic-slot";
import { featuredBoards, type FeaturedBoard } from "./homepage-cinematic-config";
import styles from "../homepage.module.css";

const copy = {
  uno: { title: "Arduino Uno R3", tag: "SIMULASI EDUKATIF", text: "Mulai dari input, output, dan logika program. Uno mendukung praktik dasar dengan subset Arduino-style yang tersedia di Vircuit.", features: ["Digital I/O", "Analog & PWM", "Simulasi edukatif"] },
  nano: { title: "Arduino Nano", tag: "VISUAL SAJA", text: "Kenali bentuk board ringkas dan susunan pinnya. Nano saat ini tersedia sebagai visual; eksekusi programnya belum didukung.", features: ["Bentuk ringkas", "Kenali pin", "Visual saja"] },
  esp32: { title: "ESP32 DevKit", tag: "SUBSET EDUKATIF", text: "Eksplorasi input dan output pada pin yang didukung. Vircuit menyediakan subset simulasi edukatif ESP32, bukan emulasi lengkap perangkat.", features: ["GPIO", "Analog & PWM", "Subset edukatif"] },
};
export function BoardArtwork({ type }: { type: FeaturedBoard }) {
  const definition = getDefinition(type);
  const layout = visualLayout(definition);
  return <ComponentVisual component={{ id: type, type, label: definition.name, position: { x: 0, y: 0 }, rotation: 0, properties: definition.defaults }} layout={layout} rotated={layout} output={0} value={0} />;
}
export function BoardShowcase() {
  return <section className={styles.section} aria-labelledby="components-heading" data-home-zone="boards">
    <SectionBackground scene="home-boards" />
    <SectionHeading id="components-heading" eyebrow="Board / Kenali titik awal eksperimenmu" title="Tiga bentuk. Dukungan yang jelas." description="Kenali board yang tersedia di Vircuit, lalu pilih langkah praktik sesuai dukungannya." />
    <div className={styles.boardShowcase} data-board-showcase>
      <figure className={styles.boardStage} data-board-stage aria-label="Spotlight Arduino Uno, Arduino Nano, dan ESP32">
        <div className={styles.boardRuler} aria-hidden="true"><span>VIRCUIT / BOARD STUDY</span><span data-board-counter>01 — 03</span></div>
        <CinematicSlot zone="boards" className={styles.boardViewport}>
          {featuredBoards.map((type) => <div key={type} data-featured-fallback={type}><BoardArtwork type={type} /></div>)}
        </CinematicSlot>
        <figcaption className={styles.boardCaption}><strong data-board-name>Uno · Nano · ESP32</strong><span data-board-context>Ilustrasi bentuk board · periksa dukungan sebelum praktik</span></figcaption>
      </figure>
      <div className={styles.boardChapters}>
        {featuredBoards.map((type, i) => <article className={styles.boardChapter} key={type} data-featured-board={type}>
          <p className={styles.eyebrow}>0{i + 1} / {copy[type].tag}</p>
          <h3>{copy[type].title}</h3>
          <p className={styles.boardDescription}>{copy[type].text}</p>
          <ul className={styles.boardFeatures}>{copy[type].features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
          {type === "esp32" && <p className="mt-5 text-xs leading-relaxed text-text-secondary">Wi-Fi dan Bluetooth hardware tidak disimulasikan.</p>}
        </article>)}
      </div>
    </div>
    <SectionLink href="/simulator" className="mt-8">Coba board di Virtual Lab</SectionLink>
  </section>;
}
