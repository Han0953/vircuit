"use client";
import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useReducedMotion } from "../preferences";
import { Check, CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { DialogContent } from "@/components/ui/dialog";

export function SettingsDialogContent({ open, children }: { open: boolean; children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const reduced = useReducedMotion();
  useGSAP(() => {
    if (!open || !root.current || reduced) return;
    gsap.fromTo(root.current.querySelectorAll("h2, p, button"), { opacity: 0.8, y: 3 }, { opacity: 1, y: 0, duration: 0.16, stagger: 0.015, clearProps: "opacity,transform" });
  }, { scope: root, dependencies: [open, reduced], revertOnUpdate: true });
  return <DialogContent ref={root} data-settings-dialog data-motion-preference={reduced ? "reduced" : "full"} className="max-h-[85dvh] overflow-y-auto" onOpenAutoFocus={() => { previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; }} onCloseAutoFocus={(event) => { if (previousFocus.current?.isConnected) { event.preventDefault(); previousFocus.current.focus({ preventScroll: true }); } }}>{children}</DialogContent>;
}

export function SettingsSection({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <section className="space-y-6"><header data-settings-motion><h2 className="text-xl font-semibold tracking-tight">{title}</h2><p className="mt-2 text-sm leading-relaxed text-text-secondary">{description}</p></header>{children}</section>;
}
export function SettingGroup({ children }: { children: ReactNode }) {
  return <div data-settings-motion className="space-y-4 rounded-xl border bg-surface p-4 sm:p-6">{children}</div>;
}
export function Feedback({ message, error = false }: { message: string; error?: boolean }) {
  const root = useRef<HTMLParagraphElement>(null);
  const reduced = useReducedMotion();
  useGSAP(() => { if (root.current && !reduced) gsap.fromTo(root.current, { opacity: 0.7, y: 3 }, { opacity: 1, y: 0, duration: 0.18, clearProps: "opacity,transform" }); }, { scope: root, dependencies: [message, reduced], revertOnUpdate: true });
  if (!message) return null;
  const Icon = error ? CircleAlert : Check;
  return <p ref={root} data-settings-feedback role={error ? "alert" : "status"} className={cn("flex items-start gap-2 rounded-lg border p-3 text-sm", error ? "border-destructive/30 text-destructive" : "border-primary/30 text-foreground")}><Icon aria-hidden className="mt-0.5 size-4 shrink-0" />{message}</p>;
}
export function Choices<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: readonly { value: T; label: string; description?: string }[]; onChange: (value: T) => void }) {
  return <fieldset className="min-w-0 space-y-3"><legend className="text-sm font-medium">{label}</legend><div className="grid gap-2 sm:grid-cols-3">{options.map((option) => <label key={option.value} className={cn("relative flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition-colors has-focus-visible:ring-2 has-focus-visible:ring-ring", option.value === value ? "border-primary bg-primary-soft" : "hover:bg-surface-muted")}><input type="radio" name={label} value={option.value} checked={option.value === value} onChange={() => onChange(option.value)} className="size-4 shrink-0 accent-primary" /><span><span className="block font-medium">{option.label}</span>{option.description && <span className="mt-1 block text-xs text-text-secondary">{option.description}</span>}</span></label>)}</div></fieldset>;
}
