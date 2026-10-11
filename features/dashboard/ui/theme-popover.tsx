"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const themeOptions = [
  { value: "light", label: "Terang", icon: Sun },
  { value: "dark", label: "Gelap", icon: Moon },
  { value: "system", label: "Sistem", icon: Monitor },
] as const;

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

export function ThemePopover({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  const currentTheme = mounted ? theme : "system";
  const selected =
    themeOptions.find((option) => option.value === currentTheme) ?? themeOptions[2];
  const Icon = selected.icon;

  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const hoverRef = useRef(false);

  const cancelTimer = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = undefined;
    }
  };

  const scheduleLeave = () => {
    cancelTimer();
    if (hoverRef.current) {
      timer.current = setTimeout(() => {
        setOpen(false);
        hoverRef.current = false;
      }, 220);
    }
  };

  useEffect(() => {
    return () => cancelTimer();
  }, []);

  const changeTheme = (value: string) => {
    hoverRef.current = false;
    cancelTimer();
    setOpen(false);

    if (value === theme) return;

    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setTheme(value);
      return;
    }

    if (typeof document !== "undefined" && "startViewTransition" in document) {
      const doc = document as unknown as {
        startViewTransition: (cb: () => void) => { ready: Promise<void> };
      };
      try {
        const transition = doc.startViewTransition(() => {
          flushSync(() => setTheme(value));
        });
        void transition.ready.catch(() => {});
        return;
      } catch {
        setTheme(value);
        return;
      }
    }

    setTheme(value);
  };

  return (
    <DropdownMenu
      modal={false}
      open={open}
      onOpenChange={(nextOpen) => {
        cancelTimer();
        setOpen(nextOpen);
        if (!nextOpen) hoverRef.current = false;
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={!mounted}
          className={cn("size-9 rounded-md text-text-secondary hover:text-foreground", className)}
          aria-label={`Pilih tema tampilan (Saat ini: ${selected.label})`}
          onPointerDown={(event) => {
            // Prevent double-toggle if triggered while hover is active
            if (hoverRef.current && open) {
              event.preventDefault();
            }
            hoverRef.current = false;
            cancelTimer();
          }}
          onPointerEnter={(event) => {
            if (event.pointerType === "mouse") {
              hoverRef.current = true;
              cancelTimer();
              timer.current = setTimeout(() => setOpen(true), 120);
            }
          }}
          onPointerLeave={(event) => {
            if (event.pointerType === "mouse") {
              scheduleLeave();
            }
          }}
        >
          <Icon className="size-4.5 shrink-0 transition-transform duration-200" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={6}
        className="w-36 p-1.5 shadow-md"
        onPointerEnter={() => {
          hoverRef.current = true;
          cancelTimer();
        }}
        onPointerLeave={scheduleLeave}
      >
        <div className="space-y-0.5" role="radiogroup" aria-label="Pilihan tema">
          {themeOptions.map(({ value, label, icon: OptionIcon }) => {
            const isSelected = value === currentTheme;
            return (
              <DropdownMenuItem
                key={value}
                role="radio"
                aria-checked={isSelected}
                onClick={() => changeTheme(value)}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-2 rounded-sm px-2.5 py-1.5 text-xs font-medium",
                  isSelected
                    ? "bg-primary-soft text-primary font-semibold"
                    : "text-text-secondary hover:bg-surface-muted hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-2">
                  <OptionIcon className="size-3.5 shrink-0" aria-hidden="true" />
                  <span>{label}</span>
                </div>
                {isSelected && <Check className="size-3.5 shrink-0 text-primary" aria-hidden="true" />}
              </DropdownMenuItem>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
