import { ArrowDown, ArrowRight, Cpu, Fan, Thermometer } from "lucide-react";
import { SectionHeading } from "./section-heading";

const stages = [
  {
    name: "Input",
    icon: Thermometer,
    title: "Sensor membaca suhu",
    detail: "Nilai suhu menjadi masukan bagi program.",
    example: "Suhu melewati ambang",
  },
  {
    name: "Processing",
    icon: Cpu,
    title: "Kode memeriksa kondisi",
    detail: "Board memproses nilai sesuai logika yang ditulis.",
    example: "Jika suhu > ambang",
  },
  {
    name: "Output",
    icon: Fan,
    title: "Kipas merespons",
    detail: "Program mengirim perintah untuk mengaktifkan kipas melalui relay.",
    example: "Kipas dinyalakan",
  },
];

export function InputOutputSection() {
  return (
    <section aria-labelledby="flow-heading" className="border-t">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-8 lg:py-24">
        <SectionHeading
          id="flow-heading"
          eyebrow="03 / Hubungan sebab dan akibat"
          title="Input berubah. Logika bekerja. Output merespons."
          description="Contoh kontrol suhu memperlihatkan bagaimana sensor, program, dan aktuator saling terhubung."
        />
        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {stages.map(({ name, icon: Icon, title, detail, example }, index) => (
            <li
              key={name}
              className="relative flex flex-col border-l-2 border-border-strong bg-surface p-6 sm:p-8"
            >
              <p className="mb-8 flex items-center justify-between gap-4 font-mono text-xs text-text-secondary">
                <span>0{index + 1} / {name}</span>
                <Icon className="size-6 text-iot" aria-hidden="true" />
              </p>
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="mt-3 mb-8 text-sm leading-relaxed text-text-secondary">{detail}</p>
              <p className="mt-auto border-t pt-4 font-mono text-sm">{example}</p>

              {index < stages.length - 1 && (
                <>
                  <ArrowDown
                    className="absolute -bottom-5 left-1/2 size-4 text-text-secondary md:hidden"
                    aria-hidden="true"
                  />
                  <ArrowRight
                    className="absolute top-1/2 -right-5 hidden size-4 text-text-secondary md:block"
                    aria-hidden="true"
                  />
                </>
              )}
            </li>
          ))}
        </ol>
        <p className="mt-6 text-xs leading-relaxed text-text-secondary">
          Ilustrasi alur edukatif. Nilai sensor dan respons di bagian ini tidak menjalankan simulasi.
        </p>
      </div>
    </section>
  );
}
