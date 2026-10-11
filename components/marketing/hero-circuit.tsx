import { BoardArtwork } from "./scenes/board-showcase";
import styles from "./homepage.module.css";

export function HeroCircuit() {
  return <figure className={styles.heroFigure + " component-art"} data-hero-2d aria-label="Arduino Uno, Arduino Nano, dan ESP32: tiga bentuk board untuk mengenali dunia IoT">
    <div className={styles.heroStage}>
      <div className={styles.technicalGrid} data-grid aria-hidden="true" />
      <div className={styles.heroAssembly} data-assembly aria-hidden="true">
        <div className={styles.heroBoard + " " + styles.heroUno} data-hero-board="uno">
          <div data-board-motion><BoardArtwork type="uno" /></div>
          <p>01 / Arduino Uno<span>SIMULASI EDUKATIF</span></p>
        </div>
        <div className={styles.heroBoard + " " + styles.heroNano} data-hero-board="nano">
          <div data-board-motion><BoardArtwork type="nano" /></div>
          <p>02 / Arduino Nano<span>VISUAL SAJA</span></p>
        </div>
        <div className={styles.heroBoard + " " + styles.heroEsp} data-hero-board="esp32">
          <div data-board-motion><BoardArtwork type="esp32" /></div>
          <p>03 / ESP32<span>SUBSET EDUKATIF</span></p>
        </div>
        <div className={styles.codeLayer} data-code>
          <small>SKETCH.INO / OUTPUT DIGITAL</small>
          <div>pinMode(3, OUTPUT);</div>
          <div className={styles.codeLine} data-code-line>digitalWrite(3, HIGH);</div>
        </div>
        <div className={styles.outputLayer} data-output data-hero-output><span className={styles.outputDot} />D3 → LED / HIGH</div>
      </div>
    </div>
    <figcaption className={styles.caption}><span>Kenali board. Mulai bereksperimen.</span><span>01 / DARI KODE KE RESPONS</span></figcaption>
  </figure>;
}
