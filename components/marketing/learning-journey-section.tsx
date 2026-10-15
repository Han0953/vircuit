import { Play } from "lucide-react";
import { SectionBackground } from "./backgrounds/section-background";
import { StoryVisual } from "./scenes/story-visual";
import { SectionHeading } from "./section-heading";
import styles from "./homepage.module.css";
import { StoryExperience } from "./scenes/story-context";
import { componentMotion, primaryTypes } from "./scenes/component-motion-registry";

const beats = [
  { title: "Mulai dari rasa ingin tahu.", phases: ["Learn"], text: "Mengapa LED butuh resistor? Pahami tujuannya sebelum menyambungkan pin." },
  { title: "Bangun jalur untuk idemu.", phases: ["Build", "Wire"], text: "Susun board, resistor, dan LED. Hubungkan output ke anoda, lalu lengkapi jalur ke ground." },
  { title: "Beri instruksi. Amati responsnya.", phases: ["Code", "Simulate"], text: "Tulis logika dalam Code Workspace. Jalankan simulasi dan lihat bagaimana program mengubah output." },
  { title: "Coba, perbaiki, lalu pahami.", phases: ["Debug", "Challenge", "Evaluate"], text: "Pin belum cocok? Telusuri masalahnya. Uji kembali melalui challenge dan gunakan feedback untuk langkah berikutnya." },
];

export function LearningJourneySection() {
  return <section data-home-zone="story" className={styles.story} aria-labelledby="journey-heading">
    <SectionBackground scene="home-story" />
    <div className={styles.section}>
      <SectionHeading id="journey-heading" eyebrow="02 / Learning by doing" title="Dari materi ke rangkaian yang kamu pahami." description="Satu alur belajar. Setiap percobaan membuat hubungan antara teori dan hasil semakin jelas." />
      <StoryExperience><div className={styles.storyGrid} data-story>
        <figure className={styles.storyFigure} aria-label="Empat tahap ilustrasi belajar dengan rangkaian LED">
        <div className={styles.storyStage} data-stage>
          <header><span>VIRCUIT / LEARNING LAB</span><span data-stage-count>04 / 04</span></header>
          <div className={styles.storyProgress} data-progress />
          <div className={styles.storyCircuit}><StoryVisual /></div>
          <div className={styles.storyOverlay} data-frame="1"><strong>01 / Tujuan praktik</strong><p className="mt-1">Pahami jalur output → resistor → LED → ground.</p></div>
          <div className={styles.storyOverlay} data-frame="2">
            <div className="flex items-center justify-between gap-3"><strong>03 / Code Workspace</strong><span data-run className="flex items-center gap-1 text-primary"><Play className="size-3" aria-hidden="true" />Run</span></div>
            <p className="mt-1 font-mono text-primary" data-story-code>digitalWrite(3, HIGH);</p>
          </div>
          <div className={styles.storyOverlay} data-frame="3"><strong>04 / Periksa kembali</strong><p className="mt-1" data-diagnostic-copy>Contoh: wiring D3, kode D5. Cocokkan pin sebelum evaluasi ulang.</p></div>
        </div>
        <ol className={styles.storyRail} data-stage-details="story">
          {beats.map((beat, i) => <li key={beat.title} className={styles.storyBeat} data-beat>
            <p className={styles.beatNumber}>0{i + 1} / {beat.phases.join(" + ")}</p>
            <h3 className={styles.beatTitle}>{beat.title}</h3><p className={styles.beatText}>{beat.text}</p>
            <div className={styles.journeyNames}>{beat.phases.map((phase) => <span data-home-item key={phase}>{phase}</span>)}</div>
          </li>)}
        </ol>
        <figcaption className={styles.storyNote}><span>{primaryTypes.map((type) => componentMotion[type].label).join(" · ")}. </span>Ilustrasi tahapan belajar; bukan simulator aktif.</figcaption>
        </figure>
      </div></StoryExperience>
    </div>
  </section>;
}
