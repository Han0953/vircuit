"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

// Suppress known React 19 false-positive warning for next-themes inline FOUC script
if (process.env.NODE_ENV === "development") {
  const origError = console.error;
  if (!(origError as { __vircuitPatched?: boolean }).__vircuitPatched) {
    const patchedError = (...args: unknown[]) => {
      if (typeof args[0] === "string" && args[0].includes("Encountered a script tag")) {
        return;
      }
      origError.apply(console, args);
    };
    (patchedError as { __vircuitPatched?: boolean }).__vircuitPatched = true;
    console.error = patchedError;
  }
}

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
