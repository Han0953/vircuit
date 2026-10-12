"use client";
import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export interface PickerOption { value: string; label: string; description?: string; icon?: ReactNode }
export function OptionPicker({ label, value, options, onChange, disabled, id, compact = false }: {
  label: string; value: string; options: readonly PickerOption[]; onChange: (value: string) => void; disabled?: boolean; id?: string; compact?: boolean;
}) {
  const selected = options.find((option) => option.value === value);
  return <DropdownMenu modal={false}>
    <DropdownMenuTrigger asChild><Button id={id} type="button" variant="outline" aria-label={label} data-value={value} data-option-trigger data-compact={compact} disabled={disabled} className="max-w-full min-w-0 justify-between gap-2">
      {selected?.icon}<span className="truncate">{selected?.label ?? label}</span><ChevronDown aria-hidden className="size-3.5 shrink-0" />
    </Button></DropdownMenuTrigger>
    <DropdownMenuContent data-option-menu align="start" sideOffset={8} className="w-72 max-w-[calc(100vw-24px)]" onEscapeKeyDown={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
      <DropdownMenuLabel className="text-xs text-text-secondary">{label}</DropdownMenuLabel><DropdownMenuSeparator />
      <DropdownMenuRadioGroup value={value} onValueChange={(next) => { if (options.some((option) => option.value === next)) onChange(next); }}>
        {options.map((option) => <DropdownMenuRadioItem key={option.value} value={option.value} aria-label={option.label} data-option-item>
          {option.icon}<span className="min-w-0"><span className="block font-medium">{option.label}</span>{option.description && <span className="mt-0.5 block text-xs leading-relaxed text-text-secondary">{option.description}</span>}</span>
        </DropdownMenuRadioItem>)}
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  </DropdownMenu>;
}
