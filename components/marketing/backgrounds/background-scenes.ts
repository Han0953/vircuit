// Authored art direction, kept separate from content and foreground animation.
export type BackgroundTone = "paper" | "muted" | "blue" | "night" | "inverse" | "violet";
export type BackgroundMotif = "traces" | "blueprint" | "journey" | "diagnostics" | "tiles" | "spotlight";
type Treatment = { tone: BackgroundTone; motif: BackgroundMotif; motion?: boolean; owner?: "features" | "roadmap" };

export const backgroundScenes = {
  "home-hero": { tone: "blue", motif: "traces", motion: true },
  "home-problem": { tone: "paper", motif: "traces", motion: true },
  "home-story": { tone: "night", motif: "spotlight" },
  "home-boards": { tone: "blue", motif: "blueprint", motion: true },
  "home-workspace": { tone: "paper", motif: "blueprint", motion: true },
  "home-cirra": { tone: "violet", motif: "journey", motion: true },
  "home-challenge": { tone: "inverse", motif: "diagnostics", motion: true },
  "home-projects": { tone: "muted", motif: "tiles" },
  "home-access": { tone: "paper", motif: "spotlight" },
  "home-closing": { tone: "inverse", motif: "traces", motion: true },
  "features-hero": { tone: "night", motif: "blueprint", motion: true },
  "features-story": { tone: "blue", motif: "blueprint", owner: "features" },
  "features-workspace": { tone: "paper", motif: "blueprint" },
  "features-runtime": { tone: "inverse", motif: "diagnostics", motion: true },
  "features-cirra": { tone: "violet", motif: "journey" },
  "features-learning": { tone: "muted", motif: "journey" },
  "features-assistant": { tone: "violet", motif: "journey", motion: true },
  "features-closing": { tone: "night", motif: "traces", motion: true },
  "learn-hero": { tone: "blue", motif: "journey", motion: true },
  "learn-roadmap": { tone: "paper", motif: "journey", owner: "roadmap" },
  "learn-cycle": { tone: "inverse", motif: "journey", motion: true },
  "learn-pillars": { tone: "muted", motif: "blueprint" },
  "learn-competencies": { tone: "blue", motif: "journey", motion: true },
  "learn-closing": { tone: "night", motif: "journey", motion: true },
  "explore-hero": { tone: "muted", motif: "tiles", motion: true },
  "explore-concepts": { tone: "paper", motif: "blueprint" },
  "explore-capstone": { tone: "inverse", motif: "tiles", motion: true },
  "explore-gallery": { tone: "paper", motif: "tiles" },
  "explore-Beginner": { tone: "paper", motif: "traces" },
  "explore-Intermediate": { tone: "blue", motif: "blueprint", motion: true },
  "explore-Advanced": { tone: "muted", motif: "tiles" },
  "explore-closing": { tone: "night", motif: "traces", motion: true },
  "pricing-hero": { tone: "paper", motif: "spotlight" },
  "pricing-plans": { tone: "blue", motif: "spotlight", motion: true },
  "pricing-comparison": { tone: "inverse", motif: "blueprint", motion: true },
  "pricing-faq": { tone: "muted", motif: "spotlight" },
  "pricing-closing": { tone: "night", motif: "spotlight", motion: true },
} as const satisfies Record<string, Treatment>;

export type BackgroundScene = keyof typeof backgroundScenes;

export function backgroundTreatment(scene: BackgroundScene): Treatment {
  return backgroundScenes[scene];
}
