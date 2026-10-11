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
        <div className={styles.heroDepth}>
          <div className={styles.heroFloat}>
            <div className={styles.heroAssembly} data-hero-tilt><HeroCircuitArtwork type={type} /></div>
          </div>
        </div>
        <div className={styles.heroStageLabel} data-hero-info>
          <span>{scene.name}</span>
          <span>{type === "nano" ? "Visual saja" : "Ilustrasi rangkaian"}</span>
        </div>
      </div>
    </div>;
  })} />;
}
