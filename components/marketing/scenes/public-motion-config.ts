export const publicRoutes = ["/fitur", "/belajar", "/jelajahi", "/harga"] as const;
export type PublicRoute = (typeof publicRoutes)[number];
export const motion = { reveal: .4, mobileReveal: .28, short: .15, state: .2, stagger: .035, desktopStagger: .06, desktopDistance: 14, mobileDistance: 6, ease: "power3.out" } as const;
export const treatments = ["text", "identity", "details", "actions", "art", "control", "static"] as const;
export type Treatment = (typeof treatments)[number];
export function validTreatment(value: string | undefined): value is Treatment {
  return treatments.some((item) => item === value);
}
export function marketingScrollRoute(path: string) {
  return path === "/" || publicRoutes.some((route) => route === path);
}
export const featureIds = ["virtual-laboratory", "circuit-builder", "interactive-wiring", "code-editor", "realtime-simulation", "problems-debugging", "ai-tutor", "ai-debugger", "project-assistant", "learning-progress"];
export const cycleIds = ["Learn", "Build", "Wire", "Code", "Simulate", "Debug", "Challenge", "Evaluate"];
export function baselineGroups(route: PublicRoute): number {
  return { "/fitur": 58, "/belajar": 76, "/jelajahi": 68, "/harga": 58 }[route];
}
