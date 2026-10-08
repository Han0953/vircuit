import type { CirraResponse } from "../contracts";
const support = { partial: "Dukungan subset", "visual-only": "Visual saja", "not-available": "Belum tersedia" };
export function ProjectBlueprint({ plan }: { plan: NonNullable<CirraResponse["blueprint"]> }) {
  return <section aria-label="Rencana project" className="space-y-3 border-t pt-3 [overflow-wrap:anywhere]">
    <h3 className="font-semibold">{plan.goal}</h3>
    <p className="text-xs text-text-secondary">Panduan rancangan; project kamu tidak diubah otomatis.</p>
    <h4 className="font-medium">Komponen</h4>
    <ul className="list-disc space-y-1 pl-5">{plan.components.map((component, index) => <li key={index}>{component.name} · {support[component.support]}</li>)}</ul>
    {([{ title: "Batasan", items: plan.constraints }, { title: "Rencana rangkaian", items: plan.circuitPlan }, { title: "Struktur program", items: plan.programStructure }, { title: "Pengujian", items: plan.testing }]).map(({ title, items }) => <div key={title}><h4 className="font-medium">{title}</h4><ul className="list-disc space-y-1 pl-5">{items.map((item, index) => <li key={index}>{item}</li>)}</ul></div>)}
  </section>;
}
