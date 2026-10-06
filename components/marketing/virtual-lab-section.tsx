import { ArrowRight, CircuitBoard, Code2, Play, Workflow } from "lucide-react";
import { LabIllustration } from "./lab-illustration";
import { marketingRoutes } from "./marketing-routes";
import { SectionHeading } from "./section-heading";
import { SectionLink } from "./section-link";

/**
 * Four fundamental pillars of the Virtual Lab workspace (PRD Section 4.1 & DESIGN.md 19.3):
 * 1. Board: Placement of microcontroller & breadboard
 * 2. Wiring: Interactive pin-to-pin connections
 * 3. Code: Integrated editor with standard Arduino syntax
 * 4. Simulation: Real-time circuit and code execution
 */
const steps = [
  { icon: CircuitBoard, name: "Board", text: "Susun board, breadboard, dan komponen." },
  { icon: Workflow, name: "Wiring", text: "Hubungkan pin untuk membentuk rangkaian." },
  { icon: Code2, name: "Code", text: "Tulis instruksi untuk mengendalikan komponen." },
  { icon: Play, name: "Simulation", text: "Amati respons rangkaian terhadap kode." },
];

/**
 * Virtual Lab showcase section on the homepage.
 * Combines an SVG vector schematic, an authentic Arduino C/C++ blink code snippet,
 * and a sequential summary of the workflow, with a link to the dedicated `/fitur` page.
 */
export function VirtualLabSection() {
  return (
    <section aria-labelledby="lab-heading" className="border-t bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-8 lg:py-24">
        <SectionHeading
          id="lab-heading"
          eyebrow="02 / Virtual Lab"
          title="Satu tempat untuk merangkai pemahaman."
          description="Dari menyusun komponen hingga membaca hasil: Virtual Lab dirancang untuk menghubungkan rangkaian, wiring, kode, dan simulasi dalam satu alur praktik."
        />

        {/* 2D Vector Schematic and Synchronized Code Preview */}
        <figure className="mt-10 overflow-hidden rounded-lg border bg-background">
          <figcaption className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 text-xs text-text-secondary">
            <span className="font-mono">VIRCUIT / VIRTUAL LAB</span>
            <span>Pratinjau konsep 2D · bukan simulator aktif</span>
          </figcaption>
          <div className="grid lg:grid-cols-2">
            <div className="flex items-center p-4 sm:p-8">
              <LabIllustration />
            </div>
            <div className="min-w-0 border-t bg-surface p-5 sm:p-8 lg:border-t-0 lg:border-l">
              <p className="mb-5 flex items-center gap-2 text-sm text-text-secondary">
                <Code2 className="size-4" aria-hidden="true" />
                Contoh instruksi LED
              </p>
              <pre className="overflow-x-auto font-mono text-code leading-loose">
                <code>{"void setup() {\n  pinMode(13, OUTPUT);\n}\n\nvoid loop() {\n  digitalWrite(13, HIGH);\n}"}</code>
              </pre>
              <p className="mt-6 border-t pt-4 text-sm leading-relaxed text-text-secondary">
                Kode memberi perintah HIGH. Pada rangkaian yang sesuai, output digital dapat menyalakan LED.
              </p>
            </div>
          </div>
        </figure>

        {/* 4-step workflow cards */}
        <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ icon: Icon, name, text }, index) => (
            <li key={name} className="border-t pt-5">
              <div className="mb-3 flex items-center gap-3">
                <Icon className="size-5 text-primary" aria-hidden="true" />
                <h3 className="font-semibold">{name}</h3>
                {index < steps.length - 1 && (
                  <ArrowRight className="ml-auto size-4 text-text-secondary" aria-hidden="true" />
                )}
              </div>
              <p className="text-sm leading-relaxed text-text-secondary">{text}</p>
            </li>
          ))}
        </ol>

        {/* Navigation to full feature specification page */}
        <SectionLink href={marketingRoutes.features} className="mt-8">
          Pelajari Fitur
        </SectionLink>
      </div>
    </section>
  );
}
