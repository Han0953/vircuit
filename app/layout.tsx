import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { AuthTransitionProvider } from "@/features/auth/motion/auth-transition";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "Vircuit — Virtual Lab untuk Belajar IoT",
    template: "%s · Vircuit",
  },
  description: "Belajar IoT melalui materi terstruktur, rangkaian interaktif, dan simulasi di Virtual Lab Vircuit.",
  icons: {
    icon: "/Logo.webp",
    shortcut: "/Logo.webp",
    apple: "/Logo.webp",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>
        <ThemeProvider><AuthTransitionProvider>{children}</AuthTransitionProvider></ThemeProvider>
      </body>
    </html>
  );
}
