"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { dashboardMotionTokens as tokens } from "./dashboard-motion-tokens";
import { useReducedMotion } from "@/features/settings/preferences";

// Register useGSAP plugin safely
if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP);
}

interface DashboardMotionSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function DashboardMotionSection({
  children,
  className,
  delay = 0,
}: DashboardMotionSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isReduced = useReducedMotion();

  useGSAP(
    () => {
      const container = containerRef.current;
      if (!container) return;

      const animatedElements = container.querySelectorAll<HTMLElement>(
        "[data-motion='header'], [data-motion='kpi'], [data-motion='card'], [data-motion='action'], [data-motion='meter']"
      );

      // Honor prefers-reduced-motion preference immediately
      if (isReduced) {
        gsap.set(animatedElements, { clearProps: "all" });
        return;
      }

      const isMobile = window.innerWidth < 768;
      const distY = isMobile ? tokens.distance.mobileY : 10;

      // Use a fast, self-clearing timeline with fromTo to eliminate React StrictMode/re-render target traps
      const tl = gsap.timeline({
        delay,
        defaults: {
          ease: tokens.ease.standard,
        },
        onComplete: () => {
          // Guarantee all inline styles (opacity, transform) are completely removed upon completion
          gsap.set(animatedElements, { clearProps: "all" });
        },
      });

      // 1. Header reveal (eyebrow, title, subtitle)
      const headers = container.querySelectorAll<HTMLElement>("[data-motion='header']");
      if (headers.length > 0) {
        tl.fromTo(
          headers,
          { opacity: 0.85, y: distY },
          {
            opacity: 1,
            y: 0,
            duration: 0.25,
            stagger: 0.03,
            ease: tokens.ease.smooth,
            clearProps: "all",
          },
          0
        );
      }

      // 2. Action controls (buttons, filters, search inputs)
      const actions = container.querySelectorAll<HTMLElement>("[data-motion='action']");
      if (actions.length > 0) {
        tl.fromTo(
          actions,
          { opacity: 0.88, y: distY * 0.6 },
          {
            opacity: 1,
            y: 0,
            duration: 0.22,
            stagger: 0.02,
            clearProps: "all",
          },
          0.04
        );
      }

      // 3. KPI Telemetry cards
      const kpis = container.querySelectorAll<HTMLElement>("[data-motion='kpi']");
      if (kpis.length > 0) {
        tl.fromTo(
          kpis,
          { opacity: 0.9, scale: 0.98, y: distY * 0.4 },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.25,
            stagger: 0.03,
            clearProps: "all",
          },
          0.06
        );
      }

      // 4. Content cards (course modules, challenges, projects)
      const cards = container.querySelectorAll<HTMLElement>("[data-motion='card']");
      if (cards.length > 0) {
        tl.fromTo(
          cards,
          { opacity: 0.88, y: distY * 0.75 },
          {
            opacity: 1,
            y: 0,
            duration: 0.25,
            stagger: 0.03,
            clearProps: "all",
          },
          0.08
        );
      }

      // 5. Meters and progress bars (horizontal expand)
      const meters = container.querySelectorAll<HTMLElement>("[data-motion='meter']");
      if (meters.length > 0) {
        meters.forEach((meter) => {
          gsap.fromTo(
            meter,
            { scaleX: 0.6 },
            {
              scaleX: 1,
              transformOrigin: "left center",
              duration: 0.35,
              ease: tokens.ease.standard,
              clearProps: "transform",
            }
          );
        });
      }
    },
    { scope: containerRef, dependencies: [isReduced], revertOnUpdate: true }
  );

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}
