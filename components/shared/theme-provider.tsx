"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

/**
 * Global Theme Provider wrapping the root Next.js application layout.
 *
 * Implements VIR-007 and DESIGN.md Section 5:
 * - `attribute="class"`: Injects the `.dark` class onto the root <html> element to trigger Tailwind dark variants.
 * - `defaultTheme="system"`: Honors visitor OS dark/light mode preference by default.
 * - `enableSystem`: Actively responds to OS color scheme changes.
 * - `disableTransitionOnChange`: Prevents flickering or awkward layout transitions when toggling modes.
 * - `storageKey="vircuit-theme"`: Isolates localStorage key to prevent collisions with other local apps.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      enableColorScheme
      disableTransitionOnChange
      storageKey="vircuit-theme"
    >
      {children}
    </NextThemesProvider>
  );
}
