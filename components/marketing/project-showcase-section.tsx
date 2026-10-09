import Link from "next/link";
import { ArrowUpRight, HardDrive, Cloud, FolderOpen } from "lucide-react";
import { SectionHeading } from "./section-heading";
import styles from "./homepage.module.css";

const practices = [
  ["blink", "Blink LED", "Digital output & waktu"],
  ["button", "Button LED", "Input & logika"],
  ["potentiometer", "Potentiometer PWM", "Analog & kecerahan"],
  ["debugging", "Debugging", "Wiring & kode"],
  ["traffic-light", "Traffic Light", "Mini project"],
];

export function ProjectShowcaseSection() {
  return <section className="border-y bg-surface" aria-labelledby="projects-heading">
    <div className={styles.section + " " + styles.split}>
      <div>
        <SectionHeading id="projects-heading" eyebrow="06 / Project pertamamu" title="Mulai dari LED. Lanjutkan ke project pertamamu." description="Latihan singkat untuk pemula, siswa, mahasiswa, dan pengajar yang ingin menghubungkan konsep dengan eksperimen." />
        <ul className={styles.projectList}>{practices.map(([slug, title, topic]) => <li key={slug}><Link className={styles.projectLink} href={"/dashboard/learn/dasar-iot/" + slug}>
          <span><strong className="font-medium">{title}</strong><span className="mt-1 block text-xs text-text-secondary">{topic}</span></span><ArrowUpRight className="size-5 shrink-0 text-primary" aria-hidden="true" />
        </Link></li>)}</ul>
      </div>
      <div className={styles.savePanel}>
        <FolderOpen className="mb-6 size-8 text-primary" strokeWidth={1.5} aria-hidden="true" />
        <h3 className="text-h3 font-semibold tracking-tight">Simpan pekerjaanmu. Lanjutkan eksperimennya.</h3>
        <div className="mt-7 space-y-6">
          <div className="flex gap-3"><HardDrive className="mt-1 size-5 shrink-0" aria-hidden="true" /><div><h4 className="text-sm font-semibold">Draft di browser</h4><p className="mt-2 text-sm leading-relaxed text-text-secondary">Perubahan guest tersimpan lokal di browser yang sama. Ekspor JSON untuk cadangan.</p></div></div>
          <div className="flex gap-3"><Cloud className="mt-1 size-5 shrink-0" aria-hidden="true" /><div><h4 className="text-sm font-semibold">Project di akun</h4><p className="mt-2 text-sm leading-relaxed text-text-secondary">Login untuk menyimpan project ke akun dan membukanya dari Proyek Saya. Periksa status Simpan sebelum meninggalkan pekerjaan.</p></div></div>
        </div>
        <Link href="/daftar" className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-sm text-sm font-medium text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring">Buat akun<ArrowUpRight className="size-4" aria-hidden="true" /></Link>
      </div>
    </div>
  </section>;
}
