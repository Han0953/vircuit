import type { ReactNode } from "react";
import { SectionBackground } from "./backgrounds/section-background";
import type { BackgroundScene } from "./backgrounds/background-scenes";
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
  background,
}: {
  id: string;
  eyebrow: string;
  title: ReactNode;
  description: string;
  actions?: ReactNode;
  aside?: ReactNode;
  note?: string;
  className?: string;
  background?: BackgroundScene;
}) {
  return (
    <section
      data-motion-section={id} data-hero="" aria-labelledby={id}
      className={cn("relative isolate flex min-h-svh flex-col justify-center overflow-hidden", !background && styles.circuitBackground, className)}
    >
      {background && <SectionBackground scene={background} />}
      <div
        data-page-hero-content
        className={cn(
          "mx-auto my-auto grid w-full max-w-7xl gap-8 px-4 sm:gap-10 sm:px-8 lg:gap-16",
          "pt-[calc(var(--home-header-height,64px)+2rem)] pb-12 sm:pt-[calc(var(--home-header-height,64px)+2.5rem)] sm:pb-16 lg:pt-[calc(var(--home-header-height,64px)+3rem)] lg:pb-20",
          aside && "lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-center"
        )}
      >
        <div className="min-w-0">
          <p data-motion-group={`${id}.eyebrow`} data-motion="identity" className="mb-4 flex items-center gap-3 font-mono text-xs font-medium tracking-widest text-text-secondary uppercase sm:mb-5">
            <span className="h-px w-8 bg-primary" aria-hidden="true" />
            {eyebrow}
          </p>
          <h1
            data-motion-group={`${id}.heading`} data-motion="text" id={id}
            className="max-w-3xl text-h1 font-semibold leading-(--leading-heading) tracking-tight text-balance"
          >
            {title}
          </h1>
          <p data-motion-group={`${id}.description`} data-motion="text" className="mt-4 max-w-2xl text-base leading-relaxed text-text-secondary sm:mt-5 sm:text-body-lg">
            {description}
          </p>
          {actions && <div data-motion-group={`${id}.actions`} data-motion="actions" className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row">{actions}</div>}
          {note && <p data-motion-group={`${id}.note`} data-motion="text" className="mt-3 text-xs text-text-secondary">{note}</p>}
        </div>
        {aside && <div className="min-w-0">{aside}</div>}
      </div>
    </section>
  );
}
