import Image from "next/image";
import { cn } from "@/lib/utils";

export interface BrandLogoProps {
  size?: "sm" | "default" | "lg";
  iconOnly?: boolean;
  textOnly?: boolean;
  priority?: boolean;
  className?: string;
  iconClassName?: string;
  textClassName?: string;
}

const SIZES = {
  sm: {
    iconHeight: 22,
    iconWidth: 37,
    textHeight: 15,
    textWidth: 96,
    gap: "gap-1.5",
  },
  default: {
    iconHeight: 28,
    iconWidth: 47,
    textHeight: 18,
    textWidth: 115,
    gap: "gap-2",
  },
  lg: {
    iconHeight: 34,
    iconWidth: 57,
    textHeight: 22,
    textWidth: 140,
    gap: "gap-2.5",
  },
} as const;

export function BrandLogo({
  size = "default",
  iconOnly = false,
  textOnly = false,
  priority = true,
  className,
  iconClassName,
  textClassName,
}: BrandLogoProps) {
  const config = SIZES[size] ?? SIZES.default;

  return (
    <span
      className={cn(
        "inline-flex items-center select-none",
        config.gap,
        className
      )}
    >
      {!textOnly && (
        <Image
          src="/Logo.webp"
          alt={iconOnly ? "Vircuit" : ""}
          aria-hidden={!iconOnly}
          width={config.iconWidth}
          height={config.iconHeight}
          priority={priority}
          unoptimized
          className={cn(
            "brand-logo-icon object-contain shrink-0",
            iconClassName
          )}
          style={{ width: "auto", height: `${config.iconHeight}px` }}
        />
      )}
      {!iconOnly && (
        <Image
          src="/logo-teks.webp"
          alt="Vircuit"
          width={config.textWidth}
          height={config.textHeight}
          priority={priority}
          unoptimized
          className={cn(
            "brand-logo-text object-contain shrink-0",
            textClassName
          )}
          style={{ width: "auto", height: `${config.textHeight}px` }}
        />
      )}
    </span>
  );
}
