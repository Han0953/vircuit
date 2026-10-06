import { BookOpen, Bug, Compass, Sparkles } from "lucide-react";
import { SectionHeading } from "./section-heading";

const roles = [
  { icon: BookOpen, name: "AI Tutor", text: "Membantu menjelaskan konsep dan menghubungkannya dengan praktik." },
  { icon: Bug, name: "AI Debugger", text: "Membantu memahami masalah berdasarkan konteks rangkaian dan kode." },
  { icon: Compass, name: "AI Project Assistant", text: "Membantu menyusun ide menjadi rencana project yang bisa dipelajari." },
];

export function AiLearningSection() {
  return (
    <section aria-labelledby="ai-heading" className="border-t bg-surface">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:py-24">
        <div>
          <SectionHeading id="ai-heading" eyebrow="04 / Pendamping belajar" title="Pahami kesalahannya. Temukan langkah berikutnya." description="AI dirancang untuk memberi penjelasan dan petunjuk. Proses merangkai, mencoba, dan memperbaiki tetap ada di tangan kamu." />
          <ul className="mt-8 space-y-6">
            {roles.map(({ icon: Icon, name, text }) => <li key={name} className="flex gap-4"><span className="flex size-10 shrink-0 items-center justify-center rounded-md border"><Icon className="size-5 text-ai" aria-hidden="true" /></span><div><h3 className="font-semibold">{name}</h3><p className="mt-1 text-sm leading-relaxed text-text-secondary">{text}</p></div></li>)}
          </ul>
          <p className="mt-8 text-xs leading-relaxed text-text-secondary">Fitur AI sedang disiapkan. Akses direncanakan setelah login dengan kuota sesuai paket. Simulator inti tetap dapat digunakan tanpa AI.</p>
        </div>
        <figure className="self-center rounded-lg border bg-background p-5 sm:p-8">
          <figcaption className="mb-6 flex items-center gap-3 border-b pb-5 text-xs text-text-secondary"><Sparkles className="size-5 text-ai" aria-hidden="true" />Contoh alur bantuan · bukan respons AI langsung</figcaption>
          <ol className="space-y-6">
            <li><p className="font-mono text-xs text-text-secondary">01 / MASALAH</p><h3 className="mt-2 font-semibold">LED belum menyala</h3><p className="mt-2 text-sm leading-relaxed text-text-secondary">Contoh temuan: nomor pin dalam kode berbeda dari pin yang terhubung ke LED.</p></li>
            <li className="border-l-2 border-ai pl-5"><p className="font-mono text-xs text-text-secondary">02 / PENJELASAN</p><p className="mt-2 text-sm leading-relaxed">Kode mengirim sinyal ke pin yang berbeda. Cocokkan nomor pin pada kode dengan koneksi LED pada board.</p></li>
            <li><p className="font-mono text-xs text-text-secondary">03 / PERBAIKAN OLEH PENGGUNA</p><p className="mt-2 text-sm leading-relaxed text-text-secondary">Periksa wiring, sesuaikan kode, lalu coba kembali untuk memahami hasilnya.</p></li>
          </ol>
        </figure>
      </div>
    </section>
  );
}
