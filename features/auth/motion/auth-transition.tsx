"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { authEntryCookie, doorDeadline, transitionTarget, type AuthEntry } from "./transition-contract";
import { captureLoginScreen } from "./login-screen";
import Door from "./door-overlay";
import MobileLoginTransition from "./mobile-login-transition";

type Transition = AuthEntry & { phase: "authenticating" | "waiting" | "opening" | "cancelling"; rolled: boolean; mobile: boolean };
const Context = createContext<{ begin: (target: string) => string | null; start: (target: string, intent?: string | null) => boolean; cancel: (intent: string | null, immediate?: boolean) => void; ready: (entry?: AuthEntry | null, reduced?: boolean) => void; intro: string; introStartedAt: number; handledEntry: string; waiting: boolean }>({ begin: () => null, start: () => false, cancel: () => {}, ready: () => {}, intro: "", introStartedAt: 0, handledEntry: "", waiting: false });
export const useAuthTransition = () => useContext(Context);

export function AuthTransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const current = useRef<Transition | null>(null);
  const introRoute = useRef("");
  const consumed = useRef(new Set<string>());
  const [transition, setTransition] = useState<Transition | null>(null);
  const [screen, setScreen] = useState<HTMLElement | null>(null);
  const [intro, setIntro] = useState<{ id: string; path: string; startedAt: number } | null>(null);
  const [handledEntry, setHandledEntry] = useState("");
  const [failure, setFailure] = useState("");
  const update = useCallback((value: Transition | null) => { current.current = value; setTransition(value); }, []);
  const finish = useCallback(() => { document.cookie = `${authEntryCookie}=; Path=/; Max-Age=0; SameSite=Lax`; setScreen(null); update(null); }, [update]);
  const begin = useCallback((destination: string) => {
    if (current.current) return null;
    setFailure("");
    setScreen(captureLoginScreen());
    const entry: Transition = { id: crypto.randomUUID(), target: transitionTarget(destination), expires: Date.now() + 25000, phase: "authenticating", rolled: false, mobile: window.innerWidth < 1024 };
    // Presentation only: no navigation or entry cookie before verification.
    update(entry);
    return entry.id;
  }, [update]);
  const cancel = useCallback((intent: string | null, immediate = false) => {
    if (!intent || current.current?.id !== intent) return;
    if (immediate) finish();
    else update({ ...current.current, phase: "cancelling" });
  }, [finish, update]);
  const start = useCallback((destination: string, intent?: string | null) => {
    if (intent && (current.current?.id !== intent || current.current.phase !== "authenticating")) return false;
    if (!intent && current.current) return false;
    setFailure("");
    if (!intent) setScreen(captureLoginScreen());
    const entry: Transition = { id: intent ?? crypto.randomUUID(), target: transitionTarget(destination), expires: Date.now() + doorDeadline, phase: "waiting", rolled: current.current?.rolled ?? false, mobile: current.current?.mobile ?? window.innerWidth < 1024 };
    // A short-lived presentation marker lets streamed SSR hide the intro groups
    // until their animation owner hydrates. It carries no authentication data.
    document.cookie = `${authEntryCookie}=${encodeURIComponent(JSON.stringify(entry))}; Path=/; Max-Age=60; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
    update(entry);
    // AuthForm invokes the verified Server Action to navigate with a fresh
    // route tree. This coordinator only owns the one-time visual handoff.
    return true;
  }, [update]);
  const reveal = useCallback((entry: Transition) => {
    consumed.current.add(entry.id);
    try { sessionStorage.setItem(`vircuit-entry:${entry.id}`, "1"); } catch { /* In-memory consumption still prevents replay. */ }
    introRoute.current = window.location.pathname;
    setIntro({ id: entry.id, path: introRoute.current, startedAt: performance.now() });
    finish();
  }, [finish]);
  const ready = useCallback((entry?: AuthEntry | null, reduced = false) => {
    setFailure("");
    if (entry) setHandledEntry(entry.id);
    if (reduced) {
      const id = current.current?.id ?? entry?.id;
      if (id) {
        consumed.current.add(id);
        try { sessionStorage.setItem(`vircuit-entry:${id}`, "1"); } catch { /* In-memory consumption remains available. */ }
      }
      finish(); return;
    }
    if (current.current) {
      if (new URL(current.current.target, window.location.origin).pathname !== window.location.pathname) return;
      if (current.current.phase === "waiting") {
        if (current.current.rolled) reveal(current.current);
        else update({ ...current.current, phase: "opening" });
      }
    } else if (entry && entry.expires > Date.now() && new URL(entry.target, window.location.origin).pathname === window.location.pathname) {
      document.cookie = `${authEntryCookie}=; Path=/; Max-Age=0; SameSite=Lax`;
      if (consumed.current.has(entry.id)) return;
      try { if (sessionStorage.getItem(`vircuit-entry:${entry.id}`)) return; sessionStorage.setItem(`vircuit-entry:${entry.id}`, "1"); } catch { /* In-memory consumption still prevents replay when storage is blocked. */ }
      // A callback has no login screen to open. Use the dashboard intro directly.
      consumed.current.add(entry.id);
      introRoute.current = window.location.pathname;
      setIntro({ id: entry.id, path: introRoute.current, startedAt: performance.now() });
    }
  }, [update, finish, reveal]);
  const complete = useCallback(() => {
    const entry = current.current;
    if (!entry || entry.phase === "cancelling") return;
    if (entry.phase === "opening") reveal(entry);
    else update({ ...entry, rolled: true });
  }, [reveal, update]);
  useEffect(() => {
    if (!transition) return;
    const timer = window.setTimeout(() => {
      const entry = current.current;
      if (!entry) return;
      if (entry.phase === "authenticating" || entry.phase === "cancelling") { finish(); return; }
      if (new URL(entry.target, window.location.origin).pathname !== window.location.pathname) { router.replace(entry.target); setFailure(entry.target); }
      finish();
    }, Math.max(0, transition.expires - Date.now()));
    return () => window.clearTimeout(timer);
  }, [transition, router, finish]);
  useEffect(() => {
    if (introRoute.current && pathname !== introRoute.current) { introRoute.current = ""; setIntro(null); }
    if (!current.current) return;
    const target = new URL(current.current.target, window.location.origin).pathname;
    if (pathname === target && !pathname.startsWith("/dashboard") && pathname !== "/demo") ready();
    else if (pathname !== target && !["/masuk", "/daftar"].includes(pathname)) finish();
  }, [pathname, ready, finish]);
  useEffect(() => {
    const reset = () => { finish(); setIntro(null); };
    window.addEventListener("popstate", reset);
    return () => window.removeEventListener("popstate", reset);
  }, [finish]);
  const waiting = !!transition;
  const value = useMemo(() => ({ begin, start, cancel, ready, intro: intro?.path === pathname ? intro.id : "", introStartedAt: intro?.path === pathname ? intro.startedAt : 0, handledEntry, waiting }), [begin, start, cancel, ready, intro, pathname, handledEntry, waiting]);
  return <Context.Provider value={value}>
    <div style={{ display: "contents" }} inert={!!transition}>{children}</div>
    {transition && (transition.mobile ? <MobileLoginTransition screen={screen} phase={transition.phase} onCancelled={finish} onFinished={complete} /> : <Door screen={screen} phase={transition.phase} onCancelled={finish} onFinished={complete} />)}
    {transition && transition.phase !== "cancelling" && <span role="status" className="sr-only">{transition.phase === "authenticating" ? "Memeriksa akun…" : "Membuka halaman…"}</span>}
    {failure && <div role="status" className="fixed right-4 bottom-4 z-[100] max-w-sm rounded-xl border bg-surface p-4 text-sm shadow-lg">Halaman masih dimuat. <button className="underline" onClick={() => window.location.assign(failure)}>Coba lagi</button><button className="ml-3 underline" onClick={() => setFailure("")}>Tutup</button></div>}
  </Context.Provider>;
}
