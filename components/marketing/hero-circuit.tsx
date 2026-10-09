import { CircuitArtwork } from "./scenes/circuit-artwork";
import styles from "./homepage.module.css";

export function HeroCircuit() {
  return <figure className={styles.heroFigure} aria-label="Rangkaian board, resistor, LED, dan instruksi digitalWrite">
    <div className={styles.heroStage}>
      <div className={styles.technicalGrid} data-grid aria-hidden="true" />
      <div className={styles.heroAssembly} data-assembly aria-hidden="true">
        <div className={styles.boardLayer}><CircuitArtwork /></div>
        <div className={styles.codeLayer} data-code>
          <small>SKETCH.INO / OUTPUT DIGITAL</small>
          <div>pinMode(3, OUTPUT);</div>
          <div className={styles.codeLine} data-code-line>digitalWrite(3, HIGH);</div>
        </div>
        <div className={styles.outputLayer} data-output><span className={styles.outputDot} />D3 → LED / HIGH</div>
      </div>
    </div>
    <figcaption className={styles.caption}><span>Ilustrasi alur simulasi</span><span>01 / KODE MENJADI RESPONS</span></figcaption>
  </figure>;
}
