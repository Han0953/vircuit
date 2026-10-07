"use client";
import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, CircuitBoard, FolderOpen, LayoutDashboard, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cloudRequest } from "@/features/projects/cloud/request";
import { clearPrivateState } from "@/features/projects/local/controller";
import { UserMenu, type DashboardIdentity } from "./user-menu";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { exitLocalDemo } from "@/features/auth/demo";
import { flushDraft } from "@/features/projects/local/controller";
import { usePersistence } from "@/features/projects/store";

const links = [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }, { href: "/dashboard/learn", label: "Belajar", icon: BookOpen }, { href: "/dashboard/projects", label: "Proyek Saya", icon: FolderOpen }, { href: "/simulator", label: "Simulator", icon: CircuitBoard }];
export function DashboardShell({ user, children, demo = false }: { user: DashboardIdentity; children: ReactNode; demo?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sessionError, setSessionError] = useState(false);
  useEffect(() => {
    if (demo) return;
    let alive = true;
    async function check() {
      try {
        const value = await cloudRequest("/api/auth/session");
        if (!alive) return;
        if (!value || typeof value !== "object" || !("user" in value)) throw new Error("Invalid session");
        const current = value.user;
        if (!current || typeof current !== "object" || !("id" in current) || current.id !== user.id) {
          clearPrivateState(user.id);
          window.location.replace("/dashboard");
        } else { setSessionError(false); router.refresh(); }
      } catch { if (alive) setSessionError(true); }
    }
    const channel = new BroadcastChannel("vircuit-auth"); channel.onmessage = () => { void check(); };
    const focus = () => { void check(); }; window.addEventListener("focus", focus);
    return () => { alive = false; channel.close(); window.removeEventListener("focus", focus); };
  }, [user.id, router, demo]);
  const navigation = demo ? links.filter((item) => item.href !== "/dashboard/learn").map((item) => ({ ...item, href: item.href.replace("/dashboard", "/demo") })) : links;
  const nav = <nav aria-label="Navigasi dashboard" className="space-y-1">{navigation.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setMobileOpen(false)} aria-current={(pathname === href || (href === "/dashboard/learn" && pathname.startsWith(href + "/"))) ? "page" : undefined} className={`flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring ${(pathname === href || (href === "/dashboard/learn" && pathname.startsWith(href + "/"))) ? "bg-primary-soft text-primary" : "text-text-secondary hover:bg-surface-muted hover:text-foreground"}`}><Icon aria-hidden className="size-5" />{label}</Link>)}</nav>;
  return <div className="min-h-dvh bg-background">
    <a href="#dashboard-main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-surface focus:p-3">Lewati navigasi</a>
    <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r bg-surface p-5 lg:flex"><Link href={demo ? "/demo" : "/dashboard"} className="mb-10 flex min-h-11 items-center gap-2 text-lg font-semibold focus-visible:ring-2 focus-visible:ring-ring"><CircuitBoard aria-hidden className="text-primary" />Vircuit</Link>{nav}<p className="mt-auto border-t pt-4 text-xs leading-relaxed text-text-secondary">Ruang untuk membangun dan mengembangkan proyek IoT.</p></aside>
    <div className="min-w-0 lg:pl-60">
      <header className="flex min-h-16 items-center justify-between gap-3 border-b bg-surface px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2"><Sheet open={mobileOpen} onOpenChange={setMobileOpen}><SheetTrigger asChild><Button variant="ghost" size="icon" className="lg:hidden" aria-label="Buka navigasi"><Menu aria-hidden /></Button></SheetTrigger><SheetContent side="left" className="w-72 max-w-[85vw] p-5"><SheetHeader className="px-0"><SheetTitle>Vircuit</SheetTitle><SheetDescription>Ruang proyek</SheetDescription></SheetHeader>{nav}</SheetContent></Sheet><p className="truncate text-sm font-medium">Ruang proyek</p></div>
        {demo ? <div className="flex items-center gap-2"><ThemeToggle /><Button variant="outline" onClick={() => {
          void (usePersistence.getState().ready ? flushDraft() : Promise.resolve()).then(() => { exitLocalDemo(); window.location.replace("/masuk"); }).catch(() => setSessionError(true));
        }}>Keluar demo</Button></div> : <UserMenu user={user} />}
      </header>
      <main id="dashboard-main" tabIndex={-1} className="relative mx-auto max-w-7xl space-y-8 px-4 py-8 outline-none sm:px-6 lg:px-8 lg:py-10">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-40 opacity-30 [background-image:linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        {sessionError && <p role="alert" className="relative rounded-md border p-3 text-sm">Session belum dapat diperiksa. <button className="text-primary underline" onClick={() => window.location.reload()}>Coba lagi</button></p>}
        <div className="relative space-y-8">{children}</div>
      </main>
    </div>
  </div>;
}
