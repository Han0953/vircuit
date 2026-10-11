/**
 * Motion tokens for the authenticated dashboard experience.
 * Tailored for high-productivity, crisp responsiveness, and lightweight GPU acceleration.
 */
export const dashboardMotionTokens = {
  duration: {
    micro: 0.15,      // Button taps, hover micro-interactions, tab switches
    fast: 0.25,       // Popover entrance, icon morphing
    card: 0.35,       // Card entrance, widget cascade
    reveal: 0.45,     // Section headers, hero text
    meter: 0.60,      // Progress meters, SVG trace lines
  },
  stagger: {
    fast: 0.03,       // Navigation list items
    normal: 0.05,     // Card grids, module nodes
    relaxed: 0.08,    // Hero elements, KPI cards
  },
  distance: {
    desktopY: 16,     // Subtle vertical reveal for desktop
    desktopX: 12,     // Horizontal slide for nav/sidebar items
    mobileY: 8,       // Constrained vertical distance on smaller viewports
    mobileX: 6,
  },
  scale: {
    subtleIn: 0.97,   // Subtle scale entrance for cards and popovers
    popIn: 0.92,      // Badge and icon pop entrance
  },
  ease: {
    standard: "power2.out",       // Default smooth, responsive deceleration
    smooth: "power3.out",         // Elegant hero text reveal
    inOut: "power1.inOut",        // SVG circuit path animation
    backOut: "back.out(1.5)",     // Tactile pop for icons & status chips
  },
} as const;

export type DashboardMotionTokens = typeof dashboardMotionTokens;
