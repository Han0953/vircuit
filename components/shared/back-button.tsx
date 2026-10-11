"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface BackButtonProps {
  /**
   * Fallback destination if browser history has no prior route in the session
   */
  fallbackHref: string;
  /**
   * Visible label text for the back button
   * @default "Kembali"
   */
  label?: string;
  /**
   * Button visual variant from shadcn/ui
   * @default "outline"
   */
  variant?: "outline" | "ghost" | "secondary" | "default";
  /**
   * Button size variant
   * @default "sm"
   */
  size?: "sm" | "default" | "icon";
  /**
   * If true, only renders the back arrow icon
   * @default false
   */
  iconOnly?: boolean;
  /**
   * Optional custom CSS class name
   */
  className?: string;
  /**
   * Optional explicit accessible label
   */
  ariaLabel?: string;
}

export function BackButton({
  fallbackHref,
  label = "Kembali",
  variant = "outline",
  size = "sm",
  iconOnly = false,
  className,
  ariaLabel,
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleBack}
      className={cn("gap-1.5 font-medium transition-colors cursor-pointer", className)}
      aria-label={ariaLabel ?? label}
      title={ariaLabel ?? label}
    >
      <ArrowLeft className="size-4 shrink-0" aria-hidden="true" />
      {!iconOnly && <span>{label}</span>}
    </Button>
  );
}
