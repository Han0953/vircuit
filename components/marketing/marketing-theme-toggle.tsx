"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import styles from "./home-controls.module.css";

const options = [
  { value: "light", label: "Terang", icon: Sun },
  { value: "dark", label: "Gelap", icon: Moon },
  { value: "system", label: "Sistem", icon: Monitor },
] as const;
const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

/** Public navigation only; shared workspace/dashboard theme controls stay unchanged. */
export function MarketingThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  const selected = options.find((option) => option.value === (mounted ? theme : "system")) ?? options[2];
  const Icon = selected.icon;
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const hover = useRef(false);
  const restoreFocus = useRef(false);
  const cancelTimer = () => clearTimeout(timer.current);
  const leave = () => { cancelTimer(); if (hover.current) timer.current = setTimeout(() => setOpen(false), 220); };
  useEffect(() => () => clearTimeout(timer.current), []);

  const changeTheme = (value: string) => {
    restoreFocus.current = true;
    hover.current = false;
    cancelTimer();
    if (value === theme) return;
    setTheme(value);
  };

  return <DropdownMenu modal={false} open={open} onOpenChange={(value) => { cancelTimer(); if (value) restoreFocus.current = false; setOpen(value); }}>
    <DropdownMenuTrigger asChild onPointerDown={(event) => {
      // Handle this on the primitive before Radix toggles its controlled state.
      if (hover.current && open) event.preventDefault();
      hover.current = false; cancelTimer();
    }} onKeyDown={() => { hover.current = false; cancelTimer(); }}>
      <Button ref={trigger} variant="ghost" size="icon" className={styles.themeButton} disabled={!mounted} aria-label={`Pilih tema: ${selected.label}`}
        onPointerEnter={(event) => {
          if (event.pointerType !== "mouse" || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
          hover.current = true; restoreFocus.current = false; cancelTimer(); timer.current = setTimeout(() => setOpen(true), 160);
        }} onPointerLeave={leave}>
        <Icon aria-hidden="true" key={selected.value} />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" sideOffset={10} className={styles.themeMenu} onPointerEnter={cancelTimer} onPointerLeave={leave}
      onPointerDownOutside={(event) => {
        const target = event.detail.originalEvent.target;
        if (target instanceof Node && trigger.current?.contains(target)) event.preventDefault();
      }}
      onEscapeKeyDown={() => { restoreFocus.current = true; hover.current = false; cancelTimer(); }}
      onCloseAutoFocus={(event) => {
        event.preventDefault();
        if (restoreFocus.current) trigger.current?.focus({ preventScroll: true });
      }}>
      <DropdownMenuRadioGroup value={selected.value} onValueChange={changeTheme}>
        {options.map(({ value, label, icon: OptionIcon }) => <DropdownMenuRadioItem key={value} value={value}><OptionIcon aria-hidden="true" />{label}</DropdownMenuRadioItem>)}
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  </DropdownMenu>;
}
