import { getDefinition } from "@/features/simulator/catalog/registry";
import { visualLayout } from "@/features/simulator/ui/visuals/pin-layout";
import { ComponentVisual } from "@/features/simulator/ui/visuals/component-visual";
import { secondaryTypes, componentMotion } from "./component-motion-registry";
import { MotionScene } from "./motion-scene";
import styles from "../homepage.module.css";

const descriptions = {
  nano: "Bentuk ringkas, kenali baris pinnya. Visual saja di simulator saat ini.",
  esp32: "Kenali modul dan pin untuk eksperimen input/output.",
  "breadboard-half": "Ikuti jalur rail dan kelompok koneksi.",
  "breadboard-full": "Lebih banyak ruang untuk menata rangkaian.",
  dht22: "Dari kondisi suhu dan kelembapan ke data.",
  relay: "Sinyal kontrol mengubah keadaan kontak.",
  fan: "Amati hubungan kontrol dan respons aktuator.",
};
export function CatalogShowcase() {
  return <section className={styles.section} aria-labelledby="components-heading">
    <p className={styles.eyebrow}>Komponen / dari input ke output</p>
    <h2 id="components-heading" className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight">Kenali bentuknya. Pahami perannya.</h2>
    <p className="mt-4 max-w-2xl text-text-secondary">Enam komponen di lab ilustrasi, tujuh bentuk lain untuk dijelajahi. Gerakan di sini adalah ilustrasi, bukan simulasi hardware aktif.</p>
    <MotionScene kind="catalog"><div className={styles.catalogGrid}>
      {secondaryTypes.map((type, i) => {
        const definition = getDefinition(type); const layout = visualLayout(definition);
        return <figure key={type} data-catalog-type={type} className={styles.catalogItem}>
          <div className={styles.catalogArt + " component-art"}>
            <div data-catalog-body><ComponentVisual component={{ id: type, type, label: definition.name, position: { x: 0, y: 0 }, rotation: 0, properties: definition.defaults }} layout={layout} rotated={layout} output={type === "fan" ? .6 : 0} value={50} /></div>
            <svg className={styles.catalogSignal} viewBox="0 0 160 36" aria-hidden="true">
              <path data-catalog-signal d="M4 24H36L48 9H80L92 24H156" fill="none" stroke="currentColor" strokeWidth="2" pathLength="1" />
              <circle data-catalog-indicator cx="150" cy="24" r="4" fill="currentColor" />
            </svg>
          </div>
          <figcaption><p className="font-mono text-xs text-primary">0{i + 7} / {type === "nano" ? "VISUAL SAJA" : "ILUSTRASI"}</p><h3 className="mt-2 text-lg font-semibold">{componentMotion[type].label}</h3><p className="mt-2 text-sm leading-relaxed text-text-secondary">{descriptions[type]}</p></figcaption>
        </figure>;
      })}
    </div></MotionScene>
  </section>;
}
