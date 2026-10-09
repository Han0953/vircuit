"use client";
import { useState, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cycleIds } from "./public-motion-config";
import Link from "next/link";
import { PublicArtwork } from "./public-artwork";
import styles from "../public-pages.module.css";
type Preview = { id: string; title: string; summary: string; href: string; duration: number };
export function LearningRoadmap({ lessons }: { lessons: Preview[] }) {
  const root = useRef<HTMLElement>(null);
  useGSAP(() => {
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion:no-preference)", () => {
      const line = root.current?.querySelector<SVGPathElement>("[data-roadmap-line]");
      if (!line) return;
      const length = line.getTotalLength();
      gsap.fromTo(line, { strokeDasharray: length, strokeDashoffset: length }, { strokeDashoffset: 0, ease: "none", scrollTrigger: { id: "learning-roadmap", trigger: root.current, start: "top 80%", end: "bottom 45%", scrub: .12 } });
    });
    return () => media.revert();
  }, { scope: root });
  const [active, setActive] = useState(lessons[0].id);
  const lesson = lessons.find((item) => item.id === active) ?? lessons[0];
  return <section ref={root} className={styles.section} aria-labelledby="roadmap-heading" data-motion-section="lesson-preview">
    <div className={styles.intro}><p data-motion-group="roadmap.label" data-motion="identity">Dari konsep ke praktik</p><h2 id="roadmap-heading" data-motion-group="roadmap.title" data-motion="text">Mulai dari dasar yang benar-benar tersedia.</h2><p data-motion-group="roadmap.description" data-motion="text">Satu course Arduino Uno, tujuh lesson. Pilih topik untuk melihat tujuan belajarnya; ini bukan progress akun.</p></div>
    <PublicArtwork kind="learning" id="roadmap.art" caption="Konsep → praktik → evaluasi · alur pembelajaran" />
    <figure data-motion-group="roadmap.cycle" data-motion="art" className="my-6 max-w-xl"><svg viewBox="0 0 480 360" fill="none" aria-hidden="true"><path d="M70 40v280" stroke="var(--border-strong)" strokeWidth="2" /><path data-roadmap-line d="M70 40v280" stroke="var(--primary)" strokeWidth="3" />{cycleIds.map((stage, index) => <g key={stage} data-part><circle cx="70" cy={40 + index * 40} r="10" fill="var(--surface)" stroke="var(--primary)" /><text x="110" y={45 + index * 40} fill="var(--foreground)" fontSize="16">0{index + 1} / {stage}</text></g>)}</svg><figcaption className={styles.caption}>Delapan tahap metode belajar · bukan indikator completion akun.</figcaption></figure>
    <div className={styles.filters} data-motion-group="roadmap.controls" data-motion="control" aria-label="Pilih preview materi">{lessons.map((item) => <button key={item.id} aria-pressed={active === item.id} onClick={() => setActive(item.id)}>{item.title}</button>)}</div>
    <article className={styles.lessonPreview} data-motion-card key={lesson.id}>
      <p data-motion-group="roadmap.preview.duration" data-motion="identity">{lesson.duration} menit · Dasar IoT dengan Arduino Uno</p><h3 data-motion-group="roadmap.preview.title" data-motion="text">{lesson.title}</h3><p data-motion-group="roadmap.preview.description" data-motion="text" className="my-4 text-text-secondary">{lesson.summary}</p><Link data-motion-group="roadmap.preview.action" data-motion="actions" className="inline-flex min-h-11 items-center font-semibold text-primary" href={lesson.href}>Buka materi →</Link>
    </article>
  </section>;
}
