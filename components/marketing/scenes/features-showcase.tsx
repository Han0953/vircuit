"use client";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PublicArtwork } from "./public-artwork";
import { scrollHomeTo } from "./home-scroll";
import styles from "../public-pages.module.css";

const stages = [
  ["Build", "Mulai dari komponen.", "Pilih board dan susun komponen sesuai tujuan eksperimen."],
  ["Wire", "Hubungkan logikanya.", "Kabel menghubungkan pin. Perhatikan jalur sinyal, power dan ground."],
  ["Code", "Tulis perilakunya.", "Gunakan subset Arduino-style C/C++ untuk membaca input dan mengendalikan output."],
  ["Simulate", "Amati sebab dan akibat.", "Jalankan kode, ubah input, lalu perhatikan respons komponen yang didukung."],
  ["Debug", "Pahami yang belum sesuai.", "Periksa Problems, wiring dan kesesuaian pin sebelum mencoba kembali."],
  ["Learn", "Bawa hasilnya ke pemahaman.", "Hubungkan eksperimen dengan materi dan tantangan yang mempunyai kriteria jelas."],
] as const;

export function FeaturesShowcase() {
  const root = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    if (!root.current) return;
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add({ desktop: "(min-width:1024px) and (min-height:620px)", reduce: "(prefers-reduced-motion:reduce)", all: "(min-width:0px)" }, (match) => {
      const element = root.current!;
      if (!match.conditions?.desktop || match.conditions.reduce) return;
      const stageArt = element.querySelector("[data-feature-visual]");
      const timeline = gsap.timeline({ scrollTrigger: { id: "features-story", trigger: element.querySelector("[data-stage-narrative]"), start: () => `top top+=${document.querySelector<HTMLElement>("[data-home-header]")?.offsetHeight ?? 80}`, end: "bottom center", scrub: .12, onUpdate: (self) => {
        const active = Math.min(5, Math.floor(self.progress * 6));
        element.dataset.stage = String(active);
        element.querySelectorAll<HTMLButtonElement>("[data-stage-button]").forEach((button, index) => button.setAttribute("aria-pressed", String(index === active)));
        const label = element.querySelector("[data-stage-label]"); if (label && label.textContent !== stages[active][0]) label.textContent = stages[active][0];
      } } });
      timeline.fromTo(stageArt?.querySelectorAll("[data-part]") ?? [], { y: -12 }, { y: 0, stagger: .1, duration: 1 }, 0)
        .fromTo(stageArt?.querySelectorAll("[data-trace]") ?? [], { opacity: .2 }, { opacity: 1, duration: 1 }, 1)
        .fromTo(stageArt?.querySelectorAll("[data-output]") ?? [], { opacity: .2 }, { opacity: 1, duration: 1 }, 3);
    });
    return () => media.revert();
  }, { scope: root });
  return <section className={styles.section} aria-labelledby="features-story-heading" data-motion-section="features-story">
    <div className={styles.intro}><p data-motion-group="features-story.label" data-motion="identity">01 / Di balik satu eksperimen</p><h2 id="features-story-heading" data-motion-group="features-story.heading" data-motion="text">Satu alur. Banyak hal yang bisa dipahami.</h2><p data-motion-group="features-story.description" data-motion="text">Pratinjau ini menjelaskan alur kerja Virtual Lab. Hasil dan rangkaian di sini merupakan ilustrasi.</p></div>
    <div ref={root} className={styles.featureStage} data-stage="0">
      <div className={styles.stageArt} data-feature-visual>
        <PublicArtwork kind="workspace" id="features-story.art" story />
        <p data-stage-label data-motion-group="features-story.active" data-motion="control" className={styles.caption}>Build</p>
        <div className={styles.stageTabs} data-motion-group="features-story.controls" data-motion="control">{stages.map(([stage], index) => <button key={stage} data-stage-button aria-pressed={index === 0} onClick={() => {
          if (root.current) {
            root.current.dataset.stage = String(index);
            root.current.querySelectorAll<HTMLButtonElement>("[data-stage-button]").forEach((button, position) => button.setAttribute("aria-pressed", String(position === index)));
            const label = root.current.querySelector("[data-stage-label]"); if (label) label.textContent = stage;
          }
          const target = document.getElementById(`stage-${stage}`); if (target) scrollHomeTo(Math.max(0, target.getBoundingClientRect().top + scrollY - (document.querySelector<HTMLElement>("[data-home-header]")?.offsetHeight ?? 80) - 16), target);
        }}>{stage}</button>)}</div>
      </div>
      <div className={styles.steps} data-stage-narrative>{stages.map(([stage, title, description], index) => <section key={stage} id={`stage-${stage}`} tabIndex={-1} data-motion-card>
        <p data-motion-group={`stage.${stage}.label`} data-motion="identity">0{index + 1} / {stage}</p><h3 data-motion-group={`stage.${stage}.title`} data-motion="text">{title}</h3><p data-motion-group={`stage.${stage}.description`} data-motion="text">{description}</p>
        <div className="mt-4 lg:hidden"><PublicArtwork kind="workspace" id={`stage.${stage}.art`} caption={`Ilustrasi tahap ${stage}`} /></div>
      </section>)}</div>
    </div>
  </section>;
}
