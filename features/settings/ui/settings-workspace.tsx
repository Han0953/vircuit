"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, ChevronRight, Cpu, Palette, ShieldCheck, SlidersHorizontal, UserRound, Database } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { DashboardIdentity } from "@/features/dashboard/ui/user-menu";
import { cn } from "@/lib/utils";
import type { accountInformation } from "../contracts";
import { useReducedMotion } from "../preferences";
import { AccountSettings } from "./account-settings";
import { ProfileSettings } from "./profile-settings";
import { PreferenceSettings } from "./preference-settings";
import { DataSettings } from "./data-settings";
import { SettingsDialogContent } from "./setting-controls";

gsap.registerPlugin(useGSAP);
const categories = [
  { id: "profile", title: "Profil Saya", description: "Nama dan foto", icon: UserRound },
  { id: "account", title: "Akun & Keamanan", description: "Email dan akses akun", icon: ShieldCheck },
  { id: "appearance", title: "Tampilan", description: "Tema dan animasi", icon: Palette },
  { id: "lab", title: "Virtual Lab", description: "Canvas dan workspace", icon: Cpu },
  { id: "learning", title: "Pembelajaran", description: "Ukuran teks materi", icon: BookOpen },
  { id: "data", title: "Data & Privasi", description: "Draft dan cadangan", icon: Database },
] as const;
type Category = typeof categories[number]["id"];
export function SettingsWorkspace({ user, account }: { user: DashboardIdentity; account: ReturnType<typeof accountInformation> }) {
  const router = useRouter();
  const root = useRef<HTMLDivElement>(null);
  const dirtyRef = useRef(false);
  const logoutProceed = useRef<(() => void) | null>(null);
  const [dirty, setDirty] = useState({ profile: false, account: false });
  const anyDirty = dirty.profile || dirty.account;
  const [destination, setDestination] = useState<string | null>(null);
  const [active, setActive] = useState<Category>("profile");
  const reduced = useReducedMotion();
  const profileDirty = useCallback((value: boolean) => setDirty((current) => current.profile === value ? current : { ...current, profile: value }), []);
  const accountDirty = useCallback((value: boolean) => setDirty((current) => current.account === value ? current : { ...current, account: value }), []);
  useEffect(() => { dirtyRef.current = anyDirty; }, [anyDirty]);
  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => { if (dirtyRef.current) { event.preventDefault(); event.returnValue = ""; } };
    const traverse = (event: NavigateEvent) => {
      if (dirtyRef.current && event.navigationType === "traverse" && event.cancelable) {
        event.preventDefault(); setDestination(event.destination.url);
      }
    };
    const logout = (event: Event) => {
      if (!dirtyRef.current || !(event instanceof CustomEvent)) return;
      event.preventDefault();
      const detail: unknown = event.detail;
      if (detail && typeof detail === "object" && "proceed" in detail && typeof detail.proceed === "function") {
        const proceed = detail.proceed;
        logoutProceed.current = () => proceed();
        setDestination("logout");
      }
    };
    const navigate = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!dirtyRef.current || !link || link.target === "_blank" || link.hasAttribute("download") || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const url = new URL(link.href);
      if (url.pathname === window.location.pathname && url.hash) return;
      event.preventDefault(); event.stopPropagation(); setDestination(link.href);
    };
    window.addEventListener("beforeunload", beforeUnload); window.addEventListener("vircuit-before-logout", logout); document.addEventListener("click", navigate, true);
    window.navigation?.addEventListener("navigate", traverse);
    return () => { window.removeEventListener("beforeunload", beforeUnload); window.removeEventListener("vircuit-before-logout", logout); document.removeEventListener("click", navigate, true); window.navigation?.removeEventListener("navigate", traverse); };
  }, []);
  const { contextSafe } = useGSAP(() => {
    if (!root.current) return;
    const groups = root.current.querySelectorAll("[role='tabpanel']:not([hidden]) [data-settings-motion]");
    if (reduced) { gsap.set(groups, { clearProps: "opacity,transform" }); return; }
    gsap.timeline().fromTo(groups, { opacity: 0.8, y: window.innerWidth < 768 ? 4 : 8 }, { opacity: 1, y: 0, duration: 0.24, stagger: 0.025, ease: "power2.out", clearProps: "opacity,transform" });
  }, { scope: root, dependencies: [active, reduced], revertOnUpdate: true });
  useGSAP(() => {
    const groups = root.current?.querySelectorAll("[data-settings-chrome]");
    if (!groups || reduced) return;
    gsap.fromTo(groups, { opacity: 0.8, y: 4 }, { opacity: 1, y: 0, duration: 0.24, stagger: 0.025, clearProps: "opacity,transform" });
  }, { scope: root, dependencies: [reduced], revertOnUpdate: true });
  function select(id: Category) { contextSafe(() => {
    if (id === active) return;
    const oldPanel = root.current?.querySelector(`[id='settings-${active}']`);
    if (reduced || !oldPanel) { setActive(id); return; }
    gsap.to(oldPanel, { opacity: 0.9, y: -2, duration: 0.08, overwrite: true, onComplete: () => { gsap.set(oldPanel, { clearProps: "opacity,transform" }); setActive(id); } });
  })(); }
  return <div ref={root} className="settings-workspace min-w-0 space-y-8 pb-[env(safe-area-inset-bottom)]">
    <header className="max-w-2xl space-y-3"><p data-settings-chrome className="flex items-center gap-2 text-xs font-semibold tracking-widest text-primary uppercase"><SlidersHorizontal className="size-4" aria-hidden />Akun dan aplikasi</p><h1 data-settings-chrome className="text-3xl font-semibold tracking-tight sm:text-4xl">Pengaturan</h1><p data-settings-chrome className="text-sm leading-relaxed text-text-secondary sm:text-base">Atur profil, keamanan akun, dan tampilan aplikasi.</p></header>
    <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[14rem_minmax(0,1fr)] xl:gap-8">
      <div role="tablist" aria-label="Kategori pengaturan" className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-3 xl:sticky xl:top-24 xl:grid-cols-1" onKeyDown={(event) => {
        const index = categories.findIndex((category) => category.id === active);
        const next = event.key === "Home" ? 0 : event.key === "End" ? categories.length - 1 : ["ArrowRight", "ArrowDown"].includes(event.key) ? (index + 1) % categories.length : ["ArrowLeft", "ArrowUp"].includes(event.key) ? (index - 1 + categories.length) % categories.length : null;
        if (next === null) return; event.preventDefault(); select(categories[next].id); root.current?.querySelector<HTMLButtonElement>(`#category-${categories[next].id}`)?.focus();
      }}>{categories.map(({ id, title, description, icon: Icon }) => <button key={id} data-settings-chrome id={`category-${id}`} role="tab" type="button" aria-selected={active === id} aria-controls={`settings-${id}`} tabIndex={active === id ? 0 : -1} onClick={() => select(id)} className={cn("group flex min-h-14 min-w-0 items-center gap-2 rounded-xl border p-3 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring sm:gap-3", active === id ? "border-primary/35 bg-primary-soft text-primary" : "border-transparent bg-surface hover:border-border hover:bg-surface-muted")}><Icon aria-hidden className="size-4 shrink-0" /><span className="min-w-0 flex-1"><span className="block text-xs leading-relaxed font-semibold sm:text-sm">{title}</span><span className="mt-1 hidden text-xs text-text-secondary xl:block">{description}</span></span>{active === id && <ChevronRight aria-hidden className="hidden size-4 shrink-0 sm:block" />}</button>)}</div>
      <div className="min-w-0 max-w-3xl">{categories.map(({ id }) => <div key={id} id={`settings-${id}`} role="tabpanel" aria-labelledby={`category-${id}`} hidden={active !== id} tabIndex={0} className="outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {id === "profile" ? <ProfileSettings user={user} onDirty={profileDirty} /> : id === "account" ? <AccountSettings user={user} account={account} onDirty={accountDirty} anyDirty={anyDirty} /> : id === "data" ? <DataSettings owner={user.id} hasPassword={account.hasPassword} anyDirty={anyDirty} /> : <PreferenceSettings owner={user.id} category={id} />}
      </div>)}</div>
    </div>
    <Dialog open={destination !== null} onOpenChange={(open) => { if (!open) setDestination(null); }}><SettingsDialogContent open={destination !== null}><DialogHeader><DialogTitle>Tinggalkan perubahan belum disimpan?</DialogTitle><DialogDescription>Isian formulir tetap tersedia saat berpindah kategori. Meninggalkan Settings akan membuang perubahan yang belum disimpan.</DialogDescription></DialogHeader><div className="flex flex-wrap items-center justify-center sm:justify-start gap-3"><Button variant="outline" onClick={() => setDestination(null)}>Tetap di pengaturan</Button><Button variant="destructive" onClick={() => { if (!destination) return; dirtyRef.current = false; if (destination === "logout") { setDestination(null); logoutProceed.current?.(); return; } const url = new URL(destination); setDestination(null); if (url.origin === window.location.origin) router.push(url.pathname + url.search + url.hash); else window.location.assign(url.href); }}>Buang dan lanjutkan</Button></div></SettingsDialogContent></Dialog>
  </div>;
}
