"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** Supported theme values corresponding to tokens in tokens.css and DESIGN.md Section 5 */
const themeOptions = [
  { value: "light", label: "Terang", icon: Sun },
  { value: "dark", label: "Gelap", icon: Moon },
  { value: "system", label: "Sistem", icon: Monitor },
] as const;

/** No-op subscriber for static hydration detection */
const subscribe = () => () => {};
/** Returns true only once mounted in client browser */
const clientSnapshot = () => true;
/** Returns false during SSR prerendering to avoid hydration mismatches */
const serverSnapshot = () => false;

/**
 * Accessible theme switcher component (Light / Dark / System).
 *
 * Implements PRD Section 6.13 (THEME-1..3) & DESIGN.md Section 5:
 * - Default setting is "System" to automatically match user OS preference.
 * - Uses `useSyncExternalStore` to cleanly detect client-side hydration without
 *   triggering React useEffect setState re-render waterfalls or hydration mismatch errors.
 * - Button remains accessible with aria-label describing the currently active theme.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  // Browser preferences (localStorage, matchMedia) are available only after hydration.
  const mounted = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  const currentTheme = mounted ? theme : "system";
  const selected = themeOptions.find((option) => option.value === currentTheme) ?? themeOptions[2];
  const Icon = selected.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={!mounted} aria-label={`Pilih tema: ${selected.label}`}>
          <Icon aria-hidden="true" />
          {selected.label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={currentTheme} onValueChange={setTheme}>
          {themeOptions.map(({ value, label, icon: OptionIcon }) => (
            <DropdownMenuRadioItem key={value} value={value}>
              <OptionIcon aria-hidden="true" />
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
