/** Homepage-only ownership. Artwork timelines keep their existing transform targets. */
export const homepageSections = ["hero", "problem", "story", "boards", "workspace", "cirra", "challenge", "projects", "access", "closing"] as const;
export const homeMotion = { entrance: .4, mobileEntrance: .28, stagger: .06, mobileStagger: .035, desktopTravel: 14, mobileTravel: 6 };
export const meaningfulCopy = "h1,h2,h3,h4,p,a,button,summary,figcaption,blockquote,li,header,strong,[data-home-item]";
export const sceneOwned = "[data-hero-copy],[data-hero-2d],[data-hero-board],[data-question],[data-context],[data-reply],[data-next],[data-requirement],[data-attempt],[data-correction],[data-result],[data-frame],[data-code],[data-output],[data-code-line],[data-serial]";

export function collectHomeTargets(root: HTMLElement) {
  return Array.from(root.querySelectorAll<HTMLElement>(meaningfulCopy)).filter((element) => {
    // SVG labels and nested links/paragraphs are part of their semantic parent sequence.
    if (element.closest("svg,[data-cinematic-slot]")) return false;
    const parent = element.parentElement?.closest<HTMLElement>(meaningfulCopy);
    return !parent || !root.contains(parent);
  }).map((element, index) => ({
    element,
    id: `${element.closest<HTMLElement>("[data-home-zone]")?.dataset.homeZone ?? "closing"}.${index + 1}`,
    treatment: element.closest(sceneOwned) ? "scene" : element.matches("details p") ? "disclosure" : element.matches("a,button,summary") ? "interaction" : element.matches("li,header") ? "sequence" : "entrance",
  }));
}
