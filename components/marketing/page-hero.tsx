import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import styles from "./landing-sections.module.css";

export function PageHero({
  id,
  eyebrow,
  title,
  description,
  actions,
  aside,
  note,
  className,
}: {
  id: string;
  eyebrow: string;
  title: ReactNode;
  description: string;
  actions?: ReactNode;
  aside?: ReactNode;
  note?: string;
  className?: string;
}) {
  return (
    <section
      aria-labelledby={id}
      className={cn("relative isolate overflow-hidden", styles.circuitBackground, className)}
    >
      <div
        className={cn(
          "mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-8 sm:py-16 lg:py-20",
          aside && "lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-center lg:gap-16"
        )}
      >
        <div className="min-w-0">
          <p className="mb-5 flex items-center gap-3 font-mono text-xs font-medium tracking-widest text-text-secondary uppercase">
            <span className="h-px w-8 bg-primary" aria-hidden="true" />
            {eyebrow}
          </p>
          <h1
            id={id}
            className="max-w-3xl text-h1 font-semibold leading-(--leading-heading) tracking-tight text-balance"
          >
            {title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-text-secondary sm:text-body-lg">
            {description}
          </p>
          {actions && <div className="mt-8 flex flex-col gap-3 sm:flex-row">{actions}</div>}
          {note && <p className="mt-3 text-xs text-text-secondary">{note}</p>}
        </div>
        {aside && <div className="min-w-0">{aside}</div>}
      </div>
    </section>
  );
}
