"use client";

import { useState, type ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "./input";
import { Button } from "./button";
import { cn } from "@/lib/utils";

export function PasswordInput({ className, visibilityLabel = "kata sandi", ...props }: Omit<ComponentProps<typeof Input>, "type"> & { visibilityLabel?: string }) {
  const [visible, setVisible] = useState(false);
  return <div className="relative">
    <Input {...props} type={visible ? "text" : "password"} className={cn("pr-12", className)} />
    <Button type="button" variant="ghost" size="icon" disabled={props.disabled} className="absolute inset-y-0 right-0 min-h-11 w-11" aria-label={`${visible ? "Sembunyikan" : "Tampilkan"} ${visibilityLabel}`} aria-pressed={visible} aria-controls={props.id} onClick={() => setVisible((value) => !value)}>
      {visible ? <EyeOff aria-hidden className="size-4" /> : <Eye aria-hidden className="size-4" />}
    </Button>
  </div>;
}
