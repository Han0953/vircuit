import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CircuitBoard, Info, Lock } from "lucide-react";
import { marketingRoutes } from "@/components/marketing/marketing-routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = {
  title: "Masuk",
  description:
    "Masuk ke akun Vircuit untuk menyimpan proyek, memantau kemajuan belajar, dan mengakses asistensi AI.",
};

/**
 * Public Authentication Entry Point (Route: `/masuk`).
 *
 * Scope note (AGENT.md #41 & TODO.md VIR-210..212):
 * Full Supabase Authentication (Email/Password, Google OAuth, and Session Management)
 * is scheduled for Milestone 12.
 *
 * In this marketing routing phase:
 * - Provides a visually consistent, accessible sign-in form mockup
 * - Clearly informs the user that authentication is currently in preparation
 * - Provides a prominent "Masuk sebagai Tamu" bypass directly into `/simulator`
 *   to ensure guest access (PRD Section 6.7 AUTH-5, PRD Section 7.1) is never blocked.
 */
export function MasukPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100svh-12rem)] max-w-md flex-col justify-center px-4 py-16 sm:px-6">
      <div className="rounded-xl border bg-surface p-6 sm:p-8">
        <div className="text-center">
          <Link
            href={marketingRoutes.home}
            className="inline-flex items-center gap-2 text-xl font-bold tracking-tight text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Kembali ke Beranda"
          >
            <CircuitBoard className="size-6 text-primary" strokeWidth={2} aria-hidden="true" />
            Vircuit<span className="text-primary">.</span>
          </Link>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">Masuk ke Vircuit</h1>
          <p className="mt-2 text-xs leading-relaxed text-text-secondary">
            Simpan rangkaian, lanjutkan materi belajar, dan akses asisten AI.
          </p>
        </div>

        {/* Development Notice */}
        <div className="mt-6 flex items-start gap-3 rounded-md border border-primary/30 bg-primary-soft/40 p-3 text-xs leading-relaxed text-foreground dark:text-foreground">
          <Info className="size-4 shrink-0 text-primary mt-0.5" aria-hidden="true" />
          <div>
            <p className="font-semibold text-primary">Autentikasi Sedang Disiapkan</p>
            <p className="mt-0.5 text-text-secondary">
              Sistem akun dan login Supabase dijadwalkan pada milestone berikutnya. Kamu bisa langsung mencoba Virtual Lab sebagai tamu tanpa membuat akun.
            </p>
          </div>
        </div>

        {/* Placeholder Login Form */}
        <form className="mt-6 space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-xs font-medium text-foreground">
              Alamat Email
            </label>
            <Input
              id="login-email"
              type="email"
              placeholder="nama@email.com"
              disabled
              className="mt-1 text-sm"
              autoComplete="email"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="login-password" className="block text-xs font-medium text-foreground">
                Kata Sandi
              </label>
              <span className="text-[11px] text-text-secondary">Lupa sandi?</span>
            </div>
            <Input
              id="login-password"
              type="password"
              placeholder="••••••••"
              disabled
              className="mt-1 text-sm"
              autoComplete="current-password"
            />
          </div>

          <Button type="button" disabled className="w-full h-10 mt-2">
            <Lock className="size-4 mr-2" aria-hidden="true" />
            Masuk dengan Email
          </Button>

          <div className="relative my-4 text-center">
            <span className="relative z-10 bg-surface px-3 text-[11px] font-mono uppercase text-text-secondary">
              atau
            </span>
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" />
            </div>
          </div>

          <Button type="button" disabled variant="outline" className="w-full h-10">
            Lanjutkan dengan Google
          </Button>
        </form>

        <div className="mt-8 border-t pt-6 text-center">
          <p className="text-xs text-text-secondary">Ingin langsung mencoba tanpa akun?</p>
          <Button asChild className="mt-3 w-full h-10">
            <Link href={marketingRoutes.simulator}>
              Masuk sebagai Tamu<ArrowUpRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="mt-6 text-center">
        <Link
          href={marketingRoutes.home}
          className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}

export default MasukPage;
