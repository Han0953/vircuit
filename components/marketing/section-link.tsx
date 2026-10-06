import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MarketingRoute } from "./marketing-routes";

/**
 * Reusable preview-to-detail navigation link used across homepage sections.
 *
 * Implements accessible interactive states:
 * - Minimum touch target height (min-h-11) for mobile compliance
 * - Micro-animation on hover moving the arrow icon rightward
 * - Visible focus ring utilizing `--ring` design token
 */
export function SectionLink({ href, children, className }: {
  /** Target marketing route, type-checked against marketingRoutes registry */
  href: MarketingRoute;
  /** Label content */
  children: ReactNode;
  /** Optional additional styling classes */
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex min-h-11 items-center gap-2 rounded-sm text-sm font-medium text-primary outline-none transition-colors duration-(--motion-ui) hover:text-primary-hover focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      {children}
      <ArrowRight
        aria-hidden="true"
        className="size-4 transition-transform duration-(--motion-ui) ease-(--ease-ui) group-hover:translate-x-0.5"
      />
    </Link>
  );
}
