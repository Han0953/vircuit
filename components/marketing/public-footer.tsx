import { PublicMotion } from "./scenes/public-motion-page";
import Link from "next/link";
import { CircuitBoard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { marketingRoutes } from "./marketing-routes";

const footerLinks = [
  { label: "Fitur", href: marketingRoutes.features },
  { label: "Belajar", href: marketingRoutes.learn },
  { label: "Jelajahi", href: marketingRoutes.explore },
  { label: "Harga", href: marketingRoutes.pricing },
  { label: "Masuk", href: marketingRoutes.login },
  { label: "Coba Simulator", href: marketingRoutes.simulator },
] as const;

export function PublicFooter() {
  return (
    <footer className="border-t bg-surface">
      <PublicMotion route="footer">
      <div data-motion-group="footer.trace" data-motion="art" className="mx-auto max-w-7xl px-4 pt-6 sm:px-8"><svg viewBox="0 0 480 32" fill="none" className="h-8 w-full max-w-lg text-primary" aria-hidden="true"><path data-trace d="M0 16h100l12-12h120l24 24h100l12-12h112" stroke="currentColor" /><circle data-output cx="475" cy="16" r="4" fill="currentColor" /></svg></div>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-8">
        <div className="flex flex-col justify-between gap-8 md:flex-row">
          <div className="max-w-sm">
            <Link prefetch={false} data-motion-group="footer.logo" data-motion="identity"
              href={marketingRoutes.home}
              className="inline-flex min-h-11 items-center gap-2 rounded-sm text-xl font-bold outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <CircuitBoard className="size-7 text-primary" aria-hidden="true" />
              Vircuit
            </Link>
            <p data-motion-group="footer.description" data-motion="text" className="mt-3 text-sm leading-relaxed text-text-secondary">
              Belajar IoT melalui rangkaian, eksperimen, dan pemahaman.
            </p>
          </div>

          <nav aria-label="Navigasi footer" className="grid grid-cols-2 gap-x-8 gap-y-1 self-start sm:grid-cols-3">
            {footerLinks.map(({ label, href }) => (
              <Button key={href} asChild variant="ghost" className="justify-start">
                <Link prefetch={false} data-motion-group={`footer.${href}`} data-motion="control" href={href}>{label}</Link>
              </Button>
            ))}
          </nav>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t pt-6 text-xs text-text-secondary">
          <p data-motion-group="footer.copyright" data-motion="static">Vircuit · Trio Hengker Enjoyer (FESTRA 2026)</p>

        </div>
      </div>
      </PublicMotion>
    </footer>
  );
}
