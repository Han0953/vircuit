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
      className={cn("relative isolate flex min-h-svh flex-col justify-between overflow-hidden", !background && styles.circuitBackground, className)}
    >
      {background && <SectionBackground scene={background} />}
      <div
        data-page-hero-content
        className={cn(
          "mx-auto flex h-full min-h-svh w-full max-w-7xl flex-col justify-between px-4 sm:justify-center sm:gap-10 sm:px-8 lg:gap-16",
          "pt-[calc(var(--home-header-height,64px)+clamp(0.75rem,2vh,1.75rem))] pb-[clamp(1rem,2.5vh,2.5rem)] sm:pt-[calc(var(--home-header-height,64px)+2.5rem)] sm:pb-16 lg:pt-[calc(var(--home-header-height,64px)+3rem)] lg:pb-20",
          aside && "lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-center"
        )}
      >
        <div className="min-w-0 shrink-0">
          <p data-motion-group={`${id}.eyebrow`} data-motion="identity" className="mb-2.5 flex items-center gap-3 font-mono text-xs font-medium tracking-widest text-text-secondary uppercase sm:mb-5">
            <span className="h-px w-8 bg-primary" aria-hidden="true" />
            {eyebrow}
          </p>
          <h1
            data-motion-group={`${id}.heading`} data-motion="text" id={id}
            className="max-w-3xl font-semibold leading-(--leading-heading) tracking-tight text-balance text-[clamp(1.75rem,3.8vh+0.4rem,2.75rem)] sm:text-h1"
          >
            {title}
          </h1>
          <p data-motion-group={`${id}.description`} data-motion="text" className="mt-2.5 max-w-2xl text-[clamp(0.875rem,1.8vh,1.05rem)] leading-relaxed text-text-secondary sm:mt-5 sm:text-body-lg">
            {description}
          </p>
          {actions && <div data-motion-group={`${id}.actions`} data-motion="actions" className="mt-3.5 flex flex-row flex-wrap gap-2.5 sm:mt-8 sm:gap-3">{actions}</div>}
          {note && <p data-motion-group={`${id}.note`} data-motion="text" className="mt-2 text-xs text-text-secondary sm:mt-3">{note}</p>}
        </div>
        {aside && <div className="mt-3 flex w-full min-w-0 max-w-md flex-1 items-center justify-center mx-auto sm:mt-0 sm:flex-initial lg:max-w-none">{aside}</div>}
      </div>
    </section>
  );
}
