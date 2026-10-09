import { Boxes, Cable, Clock3, Wallet } from "lucide-react";
import { SectionHeading } from "./section-heading";

const problems = [
  {
    icon: Wallet,
    title: "Biaya sebelum mencoba",
    text: "Board, sensor, dan komponen membutuhkan biaya, bahkan sebelum eksperimen pertama dimulai.",
  },
  {
    icon: Clock3,
    title: "Waktu praktik terbatas",
    text: "Alat perlu bergantian. Akses laboratorium tidak selalu mengikuti waktu belajar.",
  },
  {
    icon: Cable,
    title: "Error yang sulit ditelusuri",
    text: "Satu koneksi atau baris kode bisa mengubah hasil. Menemukan penyebabnya adalah bagian dari belajar.",
  },
  {
    icon: Boxes,
    title: "Belajar berpindah-pindah",
    text: "Materi, rangkaian, kode, dan evaluasi sering tersebar di tempat yang berbeda.",
  },
];

export function ProblemSection() {
  return (
    <section aria-labelledby="problem-heading" className="border-t">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-8 lg:grid-cols-2 lg:gap-20 lg:py-24">
        <div>
          <SectionHeading
            id="problem-heading"
            eyebrow="01 / Titik awal"
            title="Pahami konsepnya. Coba sendiri cara kerjanya."
            description="Belajar IoT membutuhkan praktik. Namun, kesempatan untuk bereksperimen belum selalu mudah dijangkau."
          />
          <p className="mt-8 max-w-md border-l-2 border-primary pl-5 text-sm leading-relaxed text-text-secondary">
            Vircuit dirancang sebagai jembatan menuju hardware nyata: tempat memahami konsep sebelum merakit perangkat fisik.
          </p>
        </div>
        <ul className="divide-y border-y">
          {problems.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-4 py-6">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-surface-muted">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
