/**
 * Central routing registry for public marketing pages.
 *
 * Single source of truth for all public route URLs across Vircuit, ensuring that
 * Navbar, Footer, Section links, and Page CTA buttons always refer to identical paths.
 */
export const marketingRoutes = {
  /** Homepage: Product overview and entry point */
  home: "/",
  /** Features page: 10 core capability breakdowns from PRD.md */
  features: "/fitur",
  /** Learning page: 8-stage pedagogical cycle and skill matrix */
  learn: "/belajar",
  /** Explore page: Catalog of beginner to advanced projects and templates */
  explore: "/jelajahi",
  /** Pricing page: Free core access vs. Premium tier entitlement comparison */
  pricing: "/harga",
  /** Auth entry: Visual sign-in placeholder with guest simulator bypass */
  login: "/masuk",
  /** Simulator entry: Official gateway to the Virtual Lab workspace */
  simulator: "/simulator",
} as const;

/** Union type representing all valid public marketing routes */
export type MarketingRoute = (typeof marketingRoutes)[keyof typeof marketingRoutes];

/**
 * Ordered list of links displayed in the desktop navbar and mobile drawer.
 * Excludes standalone utility actions like Login (/masuk) and CTA (/simulator).
 */
export const primaryNavigation: ReadonlyArray<{ label: string; href: MarketingRoute }> = [
  { label: "Beranda", href: marketingRoutes.home },
  { label: "Fitur", href: marketingRoutes.features },
  { label: "Belajar", href: marketingRoutes.learn },
  { label: "Jelajahi", href: marketingRoutes.explore },
  { label: "Harga", href: marketingRoutes.pricing },
];

/**
 * Determines whether a given route matches or is an ancestor of the current browser pathname.
 * Handles exact root matching for "/" and prefix matching for sub-paths (e.g., /fitur/...).
 *
 * @param pathname Current URL pathname from Next.js usePathname hook
 * @param href Target route to check
 * @returns true if the route should be visually highlighted as active
 */
export function isActiveRoute(pathname: string, href: MarketingRoute): boolean {
  if (href === marketingRoutes.home) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
