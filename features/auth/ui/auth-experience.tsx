"use client";
import { useCallback, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ArrowLeft } from "lucide-react";
import { BrandLogo } from "@/components/shared/brand-logo";
import { ThemePopover } from "@/features/dashboard/ui/theme-popover";
import { useReducedMotion } from "@/features/settings/preferences";
import { safeDestination } from "../redirect";
import { AuthForm } from "./auth-form";
import { AuthArtwork } from "./auth-artwork";
import "./auth.css";

gsap.registerPlugin(useGSAP);
export function AuthExperience({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const register = pathname === "/daftar";
  const [shown, setShown] = useState(register);
  const [pending, setPending] = useState({ login: false, register: false });
  const root = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  const reduced = useReducedMotion();
  const next = safeDestination(params.get("next"));
  const busy = pending.login || pending.register;
  const switching = shown !== register;
  const authPage = ["/masuk", "/daftar"].includes(pathname);
  const onBusy = useCallback((mode: "login" | "register", value: boolean) => setPending((old) => old[mode] === value ? old : { ...old, [mode]: value }), []);
  useGSAP(() => {
    if (!authPage || shown === register) return;
    if (reduced) { setShown(register); return; }
    const panel = root.current?.querySelector("[data-auth-panel]:not([hidden])");
    if (!panel) return;
    gsap.to(panel, { opacity: 0, y: -5, duration: window.innerWidth < 1024 ? 0.08 : 0.12, onComplete: () => setShown(register) });
  }, { scope: root, dependencies: [register, reduced, authPage], revertOnUpdate: true });
  useGSAP(() => {
    if (!authPage || !root.current) return;
    const initial = first.current;
    first.current = false;
    const panel = root.current.querySelector<HTMLElement>("[data-auth-panel]:not([hidden])");
    if (!panel) return;
    const focus = () => { if (!initial) panel.querySelector<HTMLElement>("h1")?.focus({ preventScroll: true }); };
    if (reduced) { focus(); return; }
    const mobile = window.innerWidth < 1024;
    const tl = gsap.timeline({ onComplete: focus });
    tl.fromTo(panel, { opacity: 0.5, x: initial ? 0 : (shown ? 24 : -24), y: 0 }, { opacity: 1, x: 0, duration: mobile ? 0.2 : 0.3, clearProps: "opacity,transform" });
    tl.fromTo(panel.querySelectorAll("[data-auth-motion]"), { opacity: 0.6, y: mobile ? 4 : 8 }, { opacity: 1, y: 0, duration: 0.2, stagger: 0.025, clearProps: "opacity,transform" }, 0.04);
    if (!mobile) {
      tl.fromTo("[data-auth-art]", { xPercent: initial ? 0 : (shown ? 100 : -100) }, { xPercent: 0, duration: 0.42, ease: "power2.inOut", clearProps: "transform" }, 0);
      tl.fromTo("[data-auth-art-copy]", { opacity: 0.5, y: 6 }, { opacity: 1, y: 0, duration: 0.24, stagger: 0.06, clearProps: "opacity,transform" }, 0.15);
      tl.fromTo("[data-auth-trace]", { strokeDasharray: 700, strokeDashoffset: 700 }, { strokeDashoffset: 0, duration: 0.5, clearProps: "strokeDasharray,strokeDashoffset" }, 0.06);
    }
  }, { scope: root, dependencies: [shown, reduced, authPage], revertOnUpdate: true });
  return <div ref={root} className="auth-experience">
    <header className="auth-topbar"><Link href="/" aria-label="Vircuit — Beranda" className="flex min-h-11 items-center rounded-md focus-visible:outline-2 focus-visible:outline-primary"><BrandLogo /></Link><ThemePopover /></header>
    <main id="auth-main" className="auth-main"><Link href="/" className="mb-5 inline-flex min-h-11 items-center gap-2 text-sm text-text-secondary hover:text-foreground"><ArrowLeft aria-hidden className="size-4" />Kembali ke Beranda</Link>
      {authPage ? <div className="auth-split" data-register={shown} aria-busy={busy || switching}>
        <div className="auth-forms"><AuthForm active={!shown} switching={switching} next={next} passwordUpdated={params.get("password") === "updated"} callbackError={!!params.get("error")} accountDeleted={params.get("account") === "deleted"} onBusy={onBusy} /><AuthForm register active={shown} switching={switching} next={next} onBusy={onBusy} /></div>
        <AuthArtwork register={shown} busy={busy} switchHref={`${shown ? "/masuk" : "/daftar"}?next=${encodeURIComponent(next)}`} />
      </div> : children}
    </main>
  </div>;
}
