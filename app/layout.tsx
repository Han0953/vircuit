import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ThemeProvider } from "@/components/shared/theme-provider";
import "./globals.css";

/**
 * Root metadata configuration for Vircuit.
 *
 * Implements App Router metadata inheritance:
 * - `default`: Displayed on the homepage or when child routes do not define a specific title.
 * - `template`: Automatically appends " · Vircuit" to page-level titles (e.g. "Fitur · Vircuit").
 */
export const metadata: Metadata = {
  title: {
    default: "Vircuit — Virtual Lab untuk Belajar IoT",
    template: "%s · Vircuit",
  },
  description: "Virtual Circuit Learning & Simulation Platform.",
};

/**
 * Root Application Layout.
 *
 * Requirements:
 * - `lang="id"`: Sets document primary language to Indonesian according to product specification.
 * - `suppressHydrationWarning`: Required by next-themes when injecting the initial theme class
 *   onto <html> before client hydration completes.
 * - `ThemeProvider`: Supplies global context for Light, Dark, and System modes.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
