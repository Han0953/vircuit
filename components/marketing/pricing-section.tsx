import { Plus } from "lucide-react";
import { SectionHeading } from "./section-heading";
import { SectionLink } from "./section-link";
import styles from "./homepage.module.css";

const questions = [
  ["Apakah harus memiliki hardware?", "Tidak untuk memulai. Kamu dapat berlatih di Virtual Lab lewat browser. Saat beralih ke hardware nyata, tetap periksa datasheet, tegangan kerja, dan keamanan rangkaian."],
  ["Apakah perlu login untuk mencoba?", "Simulator inti dapat dicoba sebagai tamu. Login diperlukan untuk materi terstruktur, challenge, progress, Cirra, dan penyimpanan project akun."],
  ["Apakah semua fitur Arduino didukung?", "Belum. Vircuit menjalankan subset Arduino-style untuk simulasi edukatif pada board yang didukung. Seluruh library dan perilaku hardware belum diemulasikan; API yang tidak didukung menghasilkan diagnostics."],
  ["Bagaimana challenge dinilai?", "Evaluator deterministic memeriksa komponen, koneksi, program, dan respons simulasi sesuai tujuan challenge. Server memverifikasi hasil sebelum mencatat completion. AI tidak menentukan pass atau fail."],
  ["Apa yang dilakukan Cirra?", "Cirra membantu menjelaskan konsep, membaca konteks masalah, dan menyusun rencana project. Cirra memberi panduan; kamu tetap merangkai, menulis kode, dan memeriksa hasilnya."],
];

export function PricingSection() {
  return <section className={styles.section + " " + styles.split} aria-labelledby="pricing-heading">
    <div>
      <SectionHeading id="pricing-heading" eyebrow="07 / Akses terbuka" title="Mulai dari rasa ingin tahu. Simulatornya gratis." description="Core simulator tetap Free. Mulai bereksperimen tanpa membeli paket atau menunggu perangkat tersedia." />
      <p className="mt-6 max-w-md text-sm leading-relaxed text-text-secondary">Premium masih berupa rencana untuk akses lanjutan. Belum tersedia pembelian; harga dan kuota paket belum ditentukan.</p>
      <SectionLink href="/harga" className="mt-6">Pelajari akses Vircuit</SectionLink>
    </div>
    <div aria-label="Pertanyaan umum">{questions.map(([question, answer]) => <details className={styles.faq} key={question}><summary>{question}<Plus className="size-4 shrink-0 text-primary" aria-hidden="true" /></summary><p>{answer}</p></details>)}</div>
  </section>;
}
