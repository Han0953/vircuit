import { Check, ArrowRight } from "lucide-react";
import { SectionHeading } from "./section-heading";
import { SectionLink } from "./section-link";
import { MotionScene } from "./scenes/motion-scene";
import styles from "./homepage.module.css";

export function ChallengeSection() {
  return <section className={styles.section + " " + styles.split} aria-labelledby="challenge-heading">
    <div>
      <SectionHeading id="challenge-heading" eyebrow="05 / Belajar, praktik, evaluasi" title="Uji pemahaman. Tahu apa yang perlu diperbaiki." description="Ikuti materi Dasar IoT dengan Arduino Uno. Bawa konsep ke lab, kerjakan challenge, lalu gunakan feedback untuk mencoba kembali." />
      <ol className="mt-7 space-y-3 text-sm text-text-secondary">
        {["Elektronika Dasar", "Digital I/O", "Analog Input", "Debugging & Project"].map((title, i) => <li key={title} className="flex gap-4 border-b pb-3"><span className="font-mono text-primary">0{i + 1}</span>{title}</li>)}
      </ol>
      <p className="mt-6 text-sm leading-relaxed text-text-secondary">Challenge memeriksa rangkaian dan perilaku program dengan aturan deterministic. Progress akun mengikuti materi yang selesai, bukan perkiraan AI.</p>
      <SectionLink href="/dashboard/learn" className="mt-6">Lihat materi dan tantangan</SectionLink>
    </div>
    <MotionScene kind="challenge"><figure className={styles.checklist}>
      <p className={styles.eyebrow}>Challenge / Blink LED</p><h3 className="mt-4 text-xl font-semibold">Buktikan lewat respons rangkaian.</h3>
      <ul className="mt-4">{["Board, resistor, dan LED tersedia", "Jalur output dan ground valid", "Program menghasilkan dua siklus Blink"].map((text) => <li key={text} data-requirement><Check className="mt-1 size-4 shrink-0 text-primary" aria-hidden="true" />{text}</li>)}</ul>
      <p className="mt-5 text-sm" data-attempt><span className="font-semibold">Belum sesuai.</span> LED belum bergantian hidup dan padam.</p>
      <p className="mt-3 flex gap-2 text-sm text-text-secondary" data-correction><ArrowRight className="mt-1 size-4 shrink-0" aria-hidden="true" />Tambahkan perubahan HIGH/LOW dan jeda, lalu evaluasi ulang.</p>
      <div className={styles.result} data-result><strong>Setelah perbaikan: sesuai.</strong><p className="mt-1">Completion tersimpan setelah verifikasi server berhasil.</p></div>
      <figcaption className={styles.caption + " mt-5"}>Ilustrasi feedback · bukan hasil atau progress akun kamu</figcaption>
    </figure></MotionScene>
  </section>;
}
