import { MarketingScroll } from "@/components/marketing/scenes/home-scroll";
import { BackToTop } from "@/components/marketing/scenes/back-to-top";
import type { ReactNode } from "react";
import { PublicFooter } from "@/components/marketing/public-footer";
import { PublicNavbar } from "@/components/marketing/public-navbar";
import { MarketingThemeMotion } from "@/components/marketing/backgrounds/marketing-theme-motion";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <MarketingScroll />
      <MarketingThemeMotion />
      <PublicNavbar />
      <BackToTop />
      <main id="main-content" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <PublicFooter />
    </>
  );
}
