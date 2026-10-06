import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MarketingRoute } from "./marketing-routes";

export function SectionLink({
  href,
  children,
  className,
}: {
  href: MarketingRoute;
  children: ReactNode;
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
