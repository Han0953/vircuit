import type { ReactNode } from "react";
import { PublicFooter } from "@/components/marketing/public-footer";
import { PublicNavbar } from "@/components/marketing/public-navbar";

/**
 * Shared layout for the public marketing route group `(marketing)`.
 *
 * Architectural benefits in Next.js App Router:
 * 1. Single layout shell wraps all public pages (/, /fitur, /belajar, /jelajahi, /harga, /masuk, /simulator).
 * 2. Eliminates duplicated navbar and footer declarations across individual page components.
 * 3. Prevents full-page reloads and maintains client-side navigation state (theme, drawer, scroll position).
 * 4. Provides the target accessible landmark `main#main-content` for keyboard skip links.
 */
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PublicNavbar />
      <main id="main-content" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <PublicFooter />
    </>
  );
}
