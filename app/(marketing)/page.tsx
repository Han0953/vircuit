import { LandingHero } from "@/components/marketing/landing-hero";
import { PublicNavbar } from "@/components/marketing/public-navbar";

export default function HomePage() {
  return (
    <>
      <PublicNavbar />
      <main id="main-content" tabIndex={-1}>
        <LandingHero />
      </main>
    </>
  );
}
