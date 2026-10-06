import { ArrowUpRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ComingSoonAction } from "./coming-soon-action";
import styles from "./landing-sections.module.css";

export function FinalCtaSection() {
  return (
    <section aria-labelledby="final-cta-heading" className={`relative isolate overflow-hidden border-t ${styles.circuitBackground}`}>
      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-8 lg:py-24">
        <div className="max-w-2xl">
          <p className="mb-4 font-mono text-xs tracking-widest text-text-secondary uppercase">08 / Langkah berikutnya</p>
          <h2 id="final-cta-heading" className="text-h1 font-semibold leading-(--leading-heading) tracking-tight text-balance">Mulai dengan satu rangkaian. Bangun pemahaman berikutnya.</h2>
          <p className="mt-5 max-w-lg leading-relaxed text-text-secondary">Kenali alur belajar Vircuit dan bersiap untuk bereksperimen di Virtual Lab.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ComingSoonAction destination="Virtual Lab"><Button className="h-12 px-6">Coba Simulator<ArrowUpRight aria-hidden="true" /></Button></ComingSoonAction>
            <Button asChild variant="outline" className="h-12 px-6"><a href="#belajar"><BookOpen aria-hidden="true" />Mulai Belajar</a></Button>
          </div>
          <p className="mt-4 text-xs text-text-secondary">Simulator segera hadir. Jelajahi alur belajarnya terlebih dahulu.</p>
        </div>
      </div>
    </section>
  );
}
