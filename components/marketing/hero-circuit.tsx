import { HeroShowcase } from "./scenes/hero-showcase";
import { HeroCircuitArtwork } from "./scenes/hero-circuit-artwork";
import { heroBoards, heroScenes } from "./scenes/hero-showcase-config";
import styles from "./homepage.module.css";

export function HeroCircuit() {
  return <HeroShowcase scenes={heroBoards.map((type, index) => {
    const scene = heroScenes[type];
    return <div key={type} data-hero-scene={type} hidden={index !== 0}>
      <div className={styles.heroStage}>
        <div className={styles.technicalGrid} data-grid aria-hidden="true" />
        <div className={styles.heroAssembly} data-hero-tilt><HeroCircuitArtwork type={type} /></div>
      </div>
      <div className={styles.heroIdentity} data-hero-info>
        <div><span className={styles.heroIndex}>0{index + 1} / BOARD STUDY</span><h2>{scene.name}</h2></div>
        <span className={styles.heroSupport}>{scene.status}</span>
      </div>
      <p className={styles.heroExplanation} data-hero-info>{scene.copy}</p>
      <div className={styles.heroCode} data-hero-info>
        <span>{type === "nano" ? "PINS / VISUAL SAJA" : "SKETCH.INO / ILUSTRASI OUTPUT"}</span>
        <code>{scene.code[0]}<br /><span className={styles.codeLine}>{scene.code[1]}</span></code>
      </div>
    </div>;
  })} />;
}
