import { ArrowRight, CircleDot, Code2, Cpu, Lightbulb, Play, Sparkles } from "lucide-react";
import { MotionScene } from "./scenes/motion-scene";
import { SectionHeading } from "./section-heading";
import { SectionLink } from "./section-link";
import styles from "./homepage.module.css";

export function VirtualLabSection() {
  return <section aria-labelledby="lab-heading" className={styles.section}>
    <div className="flex flex-wrap items-end justify-between gap-6">
      <SectionHeading id="lab-heading" eyebrow="03 / Virtual Lab" title="Satu project. Rangkaian dan kode saling terhubung." description="Atur komponen, hubungkan pin, dan lihat pengaruh program pada output. Berpindah dari Circuit ke Code tanpa meninggalkan project." />
      <SectionLink href="/simulator">Buka Virtual Lab</SectionLink>
    </div>
    <MotionScene kind="simulator">
      <figure className={styles.preview + " mt-10"}>
        <figcaption className={styles.previewHeader}><span className="flex items-center gap-2"><Cpu className="size-4 text-primary" aria-hidden="true" />BUTTON → LED</span><span>Ilustrasi workspace · bukan simulasi aktif</span></figcaption>
        <div className={styles.previewBody}>
          <aside className={styles.previewSide} aria-label="Ilustrasi Parts"><strong>Parts</strong><div className="mt-6 space-y-4 text-text-secondary"><p>Arduino Uno</p><p>Push Button</p><p>Resistor</p><p>LED</p></div></aside>
          <div className={styles.previewCenter}>
            <div className={styles.demoCanvas}>
              <p className="flex items-center justify-between text-xs text-text-secondary"><span>Circuit Workspace</span><span className="flex items-center gap-1"><Play className="size-3" aria-hidden="true" />Run</span></p>
              <div className={styles.demoFlow} aria-hidden="true">
                <div className={styles.demoUnit} data-input><CircleDot /><span>BUTTON / D2</span></div>
                <div className={styles.demoWire} data-signal />
                <div className={styles.demoUnit}><Cpu /><span>UNO / LOGIC</span></div>
                <div className={styles.demoWire} data-signal />
                <div className={styles.demoUnit + " text-iot"} data-demo-led><Lightbulb /><span>LED / D3</span></div>
              </div>
              <div className={styles.demoCirra} aria-hidden="true"><Sparkles className="size-4" /></div>
            </div>
            <div className={styles.demoCode}>
              <p className="mb-3 flex items-center gap-2 text-text-secondary"><Code2 className="size-4" aria-hidden="true" />Code Workspace / potongan loop()</p>
              <pre><code><span>int pressed = digitalRead(2) == LOW;</span>{"\n"}<span data-code-line className="text-primary">digitalWrite(3, pressed);</span></code></pre>
              <p className="mt-2 text-xs text-text-secondary">D2 memakai INPUT_PULLUP; tombol menghubungkan D2 ke GND.</p>
            </div>
            <div className={styles.demoBottom}><span>Serial Monitor</span><span className="text-text-secondary">Problems / diagnostics</span><span className="ml-auto text-primary" data-serial>Contoh output: LED HIGH</span></div>
          </div>
          <aside className={styles.previewSide} aria-label="Ilustrasi Properties"><strong>Properties</strong><p className="mt-6 text-text-secondary">LED<br />Output D3<br />Resistor seri<br />Ground</p></aside>
        </div>
      </figure>
    </MotionScene>
    <div className="mt-7 flex flex-wrap gap-x-8 gap-y-3 text-sm text-text-secondary">
      {["Input berubah", "Program membaca", "Output merespons"].map((text) => <span className="flex items-center gap-2" key={text}><ArrowRight className="size-4 text-primary" aria-hidden="true" />{text}</span>)}
    </div>
    <p className="mt-5 max-w-3xl text-xs leading-relaxed text-text-secondary">Simulasi edukatif dengan subset Arduino-style C/C++. Mendukung praktik dasar, bukan emulasi lengkap hardware atau seluruh library Arduino.</p>
  </section>;
}
