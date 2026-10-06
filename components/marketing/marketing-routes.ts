export const marketingRoutes = {
  home: "/",
  features: "/fitur",
  learn: "/belajar",
  explore: "/jelajahi",
  pricing: "/harga",
  login: "/masuk",
  simulator: "/simulator",
} as const;

export type MarketingRoute = (typeof marketingRoutes)[keyof typeof marketingRoutes];

export const primaryNavigation: ReadonlyArray<{ label: string; href: MarketingRoute }> = [
  { label: "Beranda", href: marketingRoutes.home },
  { label: "Fitur", href: marketingRoutes.features },
  { label: "Belajar", href: marketingRoutes.learn },
  { label: "Jelajahi", href: marketingRoutes.explore },
  { label: "Harga", href: marketingRoutes.pricing },
];

export function isActiveRoute(pathname: string, href: MarketingRoute): boolean {
  if (href === marketingRoutes.home) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
