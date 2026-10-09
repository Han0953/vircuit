import { BookOpen, Bug, Compass, Sparkles } from "lucide-react";
import { SectionHeading } from "./section-heading";
import { MotionScene } from "./scenes/motion-scene";
import styles from "./homepage.module.css";

const roles = [
  { icon: BookOpen, name: "Tutor", text: "Hubungkan konsep dengan praktik yang sedang kamu pelajari." },
  { icon: Bug, name: "Debugger", text: "Pahami masalah dari konteks rangkaian, kode, dan diagnostics." },
  { icon: Compass, name: "Project Assistant", text: "Susun ide menjadi rencana komponen, logika, dan langkah pengujian." },
];

export function AiLearningSection() {
  return <section className="border-y bg-surface" aria-labelledby="ai-heading">
    <div className={styles.section + " " + styles.split}>
      <div>
        <SectionHeading id="ai-heading" eyebrow="04 / Meet Cirra" title="Kenalan dengan Cirra, pendamping belajar AI kamu." description="Tanya konsep, telusuri masalah, atau susun rencana project. Kamu tetap memegang kendali atas rangkaian dan setiap perbaikannya." />
        <p className="mt-4 text-xs text-text-secondary">Circuit Intelligence for Responsive Reasoning &amp; Assistance.</p>
        <ul className="mt-8 space-y-5">{roles.map(({ icon: Icon, name, text }) => <li key={name} className="flex gap-4">
          <Icon className="mt-1 size-5 shrink-0 text-ai" aria-hidden="true" /><div><h3 className="font-semibold">{name}</h3><p className="mt-1 text-sm leading-relaxed text-text-secondary">{text}</p></div>
        </li>)}</ul>
        <p className="mt-7 text-xs leading-relaxed text-text-secondary">Cirra tersedia setelah login dengan batas penggunaan. Jawaban AI perlu ditinjau; Cirra tidak mengubah project atau menentukan kelulusan challenge.</p>
      </div>
      <MotionScene kind="cirra"><figure className={styles.conversation}>
        <header><Sparkles className="size-6 text-ai" aria-hidden="true" /><div><strong>Cirra</strong><p className="mt-1 text-xs text-text-secondary">Debugger / konteks project</p></div></header>
        <div className={styles.message} data-question>LED-ku belum menyala. Apa yang perlu aku periksa?</div>
        <p className={styles.context} data-context>CONTOH KONTEKS / Wiring: D3 · Kode: D5</p>
        <blockquote className={styles.message + " " + styles.reply} data-reply>Aku melihat kode memakai D5, sementara LED terhubung ke D3. Cocokkan nomor pin, lalu jalankan kembali.</blockquote>
        <p className="mt-5 border-t pt-4 text-sm leading-relaxed text-text-secondary" data-next>Langkah berikutnya: periksa pinMode dan digitalWrite terhadap jalur LED.</p>
        <figcaption className={styles.caption + " mt-6"}>Contoh penjelasan Cirra · bukan respons AI langsung</figcaption>
      </figure></MotionScene>
    </div>
  </section>;
}
