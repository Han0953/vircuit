import { Egg } from "lucide-react";
import { marketingRoutes } from "./marketing-routes";
import { projectCatalog } from "./project-catalog";
import { SectionHeading } from "./section-heading";
import { SectionLink } from "./section-link";

/**
 * Filtered subset of projects displayed on the landing page preview.
 * Full list across Beginner, Intermediate, and Advanced tiers is housed at `/jelajahi`.
 */
const featuredSlugs = ["traffic-light", "smart-lamp", "digital-thermometer", "weather-station", "smart-home"];
const projects = projectCatalog.filter(({ slug }) => featuredSlugs.includes(slug));

/**
 * Project showcase section on the homepage (PRD Section 4.1 & DESIGN.md 19.7).
 * Displays sample projects spanning foundational concepts to the flagship
 * IoT Egg Incubator capstone project, linking to `/jelajahi` for the full catalog.
 */
export function ProjectShowcaseSection() {
  return (
    <section aria-labelledby="projects-heading" className="border-t bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-8 lg:py-24">
        <SectionHeading
          id="projects-heading"
          eyebrow="06 / Project Showcase"
          title="Konsep yang dipelajari. Ide yang bisa dibangun."
          description="Pilihan project yang direncanakan untuk menjembatani latihan dasar dan sistem IoT yang lebih kompleks. Katalog ini merupakan pratinjau, belum dapat dibuka sebagai project."
        />
        <div className="mt-10 grid gap-8 lg:grid-cols-3">
          {/* List of beginner and intermediate highlighted projects */}
          <ul className="divide-y border-y lg:col-span-2">
            {projects.map(({ icon: Icon, name, topic, text }) => (
              <li key={name} className="flex items-start gap-4 py-6 sm:gap-6">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-md border bg-background">
                  <Icon className="size-6" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <h3 className="text-lg font-semibold">{name}</h3>
                    <p className="font-mono text-xs text-text-secondary">{topic}</p>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-text-secondary">{text}</p>
                </div>
              </li>
            ))}
          </ul>

          {/* Featured Capstone Callout (IoT Egg Incubator, PRD Section 7.5) */}
          <article className="flex flex-col rounded-lg border bg-background p-6 sm:p-8">
            <p className="font-mono text-xs tracking-widest text-text-secondary uppercase">
              Project akhir / Lanjutan
            </p>
            <div className="my-8 flex min-h-40 items-center justify-center rounded-md border border-dashed bg-surface-muted">
              <Egg className="size-20 text-primary" strokeWidth={1} aria-hidden="true" />
            </div>
            <h3 className="text-h3 font-semibold tracking-tight">IoT Egg Incubator</h3>
            <p className="mt-4 text-sm leading-relaxed text-text-secondary">
              Rangkai pemahaman sensor, kontrol suhu, display, relay, dan kipas dalam konsep inkubator telur virtual.
            </p>
            <p className="mt-auto pt-8 font-mono text-xs text-text-secondary">
              Sensor → Logika kontrol → Aktuator
            </p>
          </article>
        </div>

        {/* Navigation to full Explore catalog page */}
        <SectionLink href={marketingRoutes.explore} className="mt-8">
          Jelajahi Project
        </SectionLink>
      </div>
    </section>
  );
}
