import Link from "next/link";
import { ArrowUp, CircuitBoard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { marketingRoutes } from "./marketing-routes";

/**
 * Public marketing footer navigation targets.
 * Mirrors the primary routes available across the platform.
 */
const footerLinks = [
  { label: "Fitur", href: marketingRoutes.features },
  { label: "Belajar", href: marketingRoutes.learn },
  { label: "Jelajahi", href: marketingRoutes.explore },
  { label: "Harga", href: marketingRoutes.pricing },
  { label: "Masuk", href: marketingRoutes.login },
  { label: "Coba Simulator", href: marketingRoutes.simulator },
] as const;

/**
 * Shared public footer rendered at the bottom of all marketing routes via (marketing)/layout.tsx.
 * Includes logo brand link, structured route navigation, developer credit, and smooth scroll back to top.
 */
export function PublicFooter() {
  return (
    <footer className="border-t bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-8">
        <div className="flex flex-col justify-between gap-8 md:flex-row">
          {/* Brand info and tagline */}
          <div className="max-w-sm">
            <Link
              href={marketingRoutes.home}
              className="inline-flex min-h-11 items-center gap-2 rounded-sm text-xl font-bold outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <CircuitBoard className="size-7 text-primary" aria-hidden="true" />
              Vircuit
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-text-secondary">
              Belajar IoT melalui rangkaian, eksperimen, dan pemahaman.
            </p>
          </div>

          {/* Navigation link matrix */}
          <nav aria-label="Navigasi footer" className="grid grid-cols-2 gap-x-8 gap-y-1 self-start sm:grid-cols-3">
            {footerLinks.map(({ label, href }) => (
              <Button key={href} asChild variant="ghost" className="justify-start">
                <Link href={href}>{label}</Link>
              </Button>
            ))}
          </nav>
        </div>

        {/* Copyright and back-to-top shortcut */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t pt-6 text-xs text-text-secondary">
          <p>Vircuit · Trio Hengker Enjoyer (FESTRA 2026)</p>
          <Button asChild variant="ghost">
            <a href="#main-content">
              Kembali ke atas
              <ArrowUp aria-hidden="true" />
            </a>
          </Button>
        </div>
      </div>
    </footer>
  );
}
