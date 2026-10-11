"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  CircuitBoard,
  FolderOpen,
  LayoutDashboard,
  Menu,
  ListChecks,
  ChartNoAxesColumn,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { BrandLogo } from "@/components/shared/brand-logo";
import { cloudRequest } from "@/features/projects/cloud/request";
import { clearPrivateState } from "@/features/projects/local/controller";
import { UserMenu, type DashboardIdentity } from "./user-menu";
import { cn } from "@/lib/utils";

interface NavLinkItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: string;
  group?: "main" | "learn" | "workspace" | "lab";
}

const navLinks: NavLinkItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, group: "main" },
  { href: "/dashboard/learn", label: "Belajar", icon: BookOpen, group: "learn" },
  { href: "/dashboard/challenges", label: "Tantangan", icon: ListChecks, badge: "6", group: "learn" },
  { href: "/dashboard/progress", label: "Progress", icon: ChartNoAxesColumn, group: "learn" },
  { href: "/dashboard/projects", label: "Proyek Saya", icon: FolderOpen, group: "workspace" },
  { href: "/simulator", label: "Simulator", icon: CircuitBoard, badge: "Lab", group: "lab" },
];

export function DashboardShell({
  user,
  children,
}: {
  user: DashboardIdentity;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sessionError, setSessionError] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Monitor session validity
  useEffect(() => {
    let alive = true;
    async function check() {
      try {
        const value = await cloudRequest("/api/auth/session");
        if (!alive) return;
        if (!value || typeof value !== "object" || !("user" in value)) {
          throw new Error("Invalid session");
        }
        const current = value.user;
        if (
          !current ||
          typeof current !== "object" ||
          !("id" in current) ||
          current.id !== user.id
        ) {
          clearPrivateState(user.id);
          window.location.replace("/dashboard");
        } else {
          setSessionError(false);
          router.refresh();
        }
      } catch {
        if (alive) setSessionError(true);
      }
    }

    const channel = new BroadcastChannel("vircuit-auth");
    channel.onmessage = () => {
      void check();
    };
    const focus = () => {
      void check();
    };
    window.addEventListener("focus", focus);
    return () => {
      alive = false;
      channel.close();
      window.removeEventListener("focus", focus);
    };
  }, [user.id, router]);

  // Elevation trigger on scroll for borderless header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 12);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Determine current active page label for header breadcrumb
  const currentLink = navLinks.find(
    (item) =>
      pathname === item.href ||
      (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"))
  );
  const pageLabel = currentLink?.label ?? "Command Center";

  const renderNavigation = (onItemClick?: () => void) => (
    <nav aria-label="Navigasi dashboard" className="space-y-6">
      {/* Overview Group */}
      <div>
        <p className="px-3 pb-1 text-[11px] font-semibold tracking-wider text-text-tertiary uppercase">
          Command Center
        </p>
        <div className="mt-1 space-y-1">
          {navLinks
            .filter((l) => l.group === "main")
            .map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onItemClick}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group flex min-h-10 items-center justify-between rounded-md px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "bg-primary-soft text-primary font-semibold shadow-xs"
                      : "text-text-secondary hover:bg-surface-muted hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn("size-4.5 shrink-0 transition-colors", active ? "text-primary" : "text-text-tertiary group-hover:text-foreground")} />
                    <span>{label}</span>
                  </div>
                  {active && <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />}
                </Link>
              );
            })}
        </div>
      </div>

      {/* Learning & Practice Group */}
      <div>
        <p className="px-3 pb-1 text-[11px] font-semibold tracking-wider text-text-tertiary uppercase">
          Eksplorasi Praktik
        </p>
        <div className="mt-1 space-y-1">
          {navLinks
            .filter((l) => l.group === "learn")
            .map(({ href, label, icon: Icon, badge }) => {
              const active =
                pathname === href || (href === "/dashboard/learn" && pathname.startsWith(href + "/"));
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onItemClick}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group flex min-h-10 items-center justify-between rounded-md px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "bg-primary-soft text-primary font-semibold shadow-xs"
                      : "text-text-secondary hover:bg-surface-muted hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn("size-4.5 shrink-0 transition-colors", active ? "text-primary" : "text-text-tertiary group-hover:text-foreground")} />
                    <span>{label}</span>
                  </div>
                  {badge ? (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide",
                        active ? "bg-primary text-primary-foreground" : "bg-surface-muted text-text-secondary"
                      )}
                    >
                      {badge}
                    </span>
                  ) : active ? (
                    <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
                  ) : null}
                </Link>
              );
            })}
        </div>
      </div>

      {/* Workspace & Lab Group */}
      <div>
        <p className="px-3 pb-1 text-[11px] font-semibold tracking-wider text-text-tertiary uppercase">
          Ruang Eksperimen
        </p>
        <div className="mt-1 space-y-1">
          {navLinks
            .filter((l) => l.group === "workspace" || l.group === "lab")
            .map(({ href, label, icon: Icon, badge, group }) => {
              const active = pathname === href;
              const isLab = group === "lab";
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onItemClick}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group flex min-h-10 items-center justify-between rounded-md px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isLab
                      ? "border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10"
                      : active
                        ? "bg-primary-soft text-primary font-semibold shadow-xs"
                        : "text-text-secondary hover:bg-surface-muted hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn("size-4.5 shrink-0 transition-colors", isLab ? "text-primary" : active ? "text-primary" : "text-text-tertiary group-hover:text-foreground")} />
                    <span className={cn(isLab && "font-semibold")}>{label}</span>
                  </div>
                  {badge && (
                    <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase", isLab ? "bg-primary text-primary-foreground" : "bg-surface-muted text-text-secondary")}>
                      {badge}
                    </span>
                  )}
                </Link>
              );
            })}
        </div>
      </div>
    </nav>
  );

  return (
    <div className="min-h-dvh bg-background">
      <a
        href="#dashboard-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-60 focus:rounded-md focus:bg-primary focus:p-3 focus:text-primary-foreground focus:shadow-lg"
      >
        Lewati ke konten utama
      </a>

      {/* Persistent Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-surface p-5 lg:flex">
        <Link
          href="/dashboard"
          className="mb-8 flex min-h-11 items-center rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Vircuit — Dashboard"
        >
          <BrandLogo size="default" />
        </Link>

        <div className="flex-1 overflow-y-auto pr-1">
          {renderNavigation()}
        </div>

        {/* Sidebar Status Footer */}
        <div className="mt-auto border-t border-border/60 pt-4">
          <div className="flex items-center gap-2 rounded-md bg-surface-muted px-3 py-2 text-xs">
            <span className="relative flex size-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-foreground">Lab & Drafts Siap</p>
              <p className="truncate text-[11px] text-text-tertiary">Penyimpanan lokal aktif</p>
            </div>
            <Cpu className="size-3.5 text-text-tertiary shrink-0" aria-hidden="true" />
          </div>
        </div>
      </aside>

      {/* Main Column */}
      <div className="min-w-0 lg:pl-64">
        {/* Fixed Borderless Header */}
        <header
          className={cn(
            "fixed top-0 right-0 left-0 z-30 flex h-16 items-center justify-between gap-3 bg-surface/85 px-4 backdrop-blur-md transition-shadow duration-200 sm:px-6 lg:left-64 lg:px-8",
            scrolled && "shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.45)]"
          )}
        >
          {/* Mobile drawer trigger & breadcrumb */}
          <div className="flex min-w-0 items-center gap-2.5">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  aria-label="Buka navigasi menu"
                >
                  <Menu className="size-5" aria-hidden="true" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 max-w-[85vw] p-5">
                <SheetHeader className="px-0 pb-4 text-left">
                  <SheetTitle>
                    <BrandLogo size="default" />
                  </SheetTitle>
                  <SheetDescription>Command Center Edukasi IoT</SheetDescription>
                </SheetHeader>
                <div className="mt-4 overflow-y-auto">
                  {renderNavigation(() => setMobileOpen(false))}
                </div>
              </SheetContent>
            </Sheet>

            {/* Breadcrumb identifier */}
            <div className="min-w-0">
              <p className="text-xs font-semibold text-text-tertiary">Dashboard</p>
              <h2 className="truncate text-sm font-semibold tracking-tight text-foreground">{pageLabel}</h2>
            </div>
          </div>

          {/* User & theme actions */}
          <UserMenu user={user} />
        </header>

        {/* Scrollable Main Content */}
        <main
          id="dashboard-main"
          tabIndex={-1}
          className="relative mx-auto max-w-7xl space-y-8 px-4 pt-20 pb-12 outline-none sm:px-6 lg:px-8 lg:pt-24 lg:pb-16"
        >
          {/* Subtle circuit background grid */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-44 opacity-25 [background-image:linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:linear-gradient(to_bottom,black,transparent)]"
          />

          {sessionError && (
            <p
              role="alert"
              className="relative rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
            >
              Session belum dapat diperiksa secara daring.{" "}
              <button
                className="font-medium underline hover:text-destructive/80"
                onClick={() => window.location.reload()}
              >
                Coba lagi
              </button>
            </p>
          )}

          <div className="relative space-y-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
