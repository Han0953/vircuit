"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { authEntryCookie, doorDeadline, transitionTarget, type AuthEntry } from "./transition-contract";

const Door = dynamic(() => import("./door-overlay"), { ssr: false });
type Transition = AuthEntry & { phase: "closing" | "waiting" | "opening" };
const Context = createContext<{ start: (target: string) => void; ready: (entry?: AuthEntry | null, reduced?: boolean) => void; intro: string; waiting: boolean }>({ start: () => {}, ready: () => {}, intro: "", waiting: false });
export const useAuthTransition = () => useContext(Context);

export function AuthTransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const current = useRef<Transition | null>(null);
  const [transition, setTransition] = useState<Transition | null>(null);
  const [intro, setIntro] = useState("");
  const [failure, setFailure] = useState("");
  const update = useCallback((value: Transition | null) => { current.current = value; setTransition(value); }, []);
  const finish = useCallback(() => { update(null); }, [update]);
  const start = useCallback((destination: string) => {
    if (current.current) return;
    setFailure("");
    update({ id: crypto.randomUUID(), target: transitionTarget(destination), expires: Date.now() + doorDeadline, phase: "closing" });
  }, [update]);
  const ready = useCallback((entry?: AuthEntry | null, reduced = false) => {
    setFailure("");
    if (reduced) { document.cookie = `${authEntryCookie}=; Path=/; Max-Age=0; SameSite=Lax`; update(null); return; }
    if (current.current) {
      if (new URL(current.current.target, window.location.origin).pathname !== window.location.pathname) return;
      setIntro(current.current.id);
      update({ ...current.current, phase: "opening" });
    } else if (entry && entry.expires > Date.now() && new URL(entry.target, window.location.origin).pathname === window.location.pathname) {
      document.cookie = `${authEntryCookie}=; Path=/; Max-Age=0; SameSite=Lax`;
      try { if (sessionStorage.getItem(`vircuit-entry:${entry.id}`)) return; sessionStorage.setItem(`vircuit-entry:${entry.id}`, "1"); } catch { return; }
      setIntro(entry.id);
      update({ ...entry, expires: Date.now() + doorDeadline, phase: "opening" });
    }
  }, [update]);
  const closed = useCallback(() => {
    const entry = current.current;
    if (!entry || entry.phase !== "closing") return;
    update({ ...entry, phase: "waiting" });
    router.replace(entry.target);
  }, [router, update]);
  useEffect(() => {
    if (!transition) return;
    const timer = window.setTimeout(() => {
      const entry = current.current;
      if (!entry) return;
      if (new URL(entry.target, window.location.origin).pathname !== window.location.pathname) { router.replace(entry.target); setFailure(entry.target); }
      finish();
    }, Math.max(0, transition.expires - Date.now()));
    return () => window.clearTimeout(timer);
  }, [transition, router, finish]);
  useEffect(() => {
    if (!current.current) return;
    const target = new URL(current.current.target, window.location.origin).pathname;
    if (pathname === target && !pathname.startsWith("/dashboard")) ready();
    else if (pathname !== target && !["/masuk", "/daftar"].includes(pathname)) finish();
  }, [pathname, ready, finish]);
  useEffect(() => {
    const reset = () => { finish(); setIntro(""); };
    window.addEventListener("popstate", reset);
    return () => window.removeEventListener("popstate", reset);
  }, [finish]);
  const waiting = transition?.phase === "closing" || transition?.phase === "waiting";
  const value = useMemo(() => ({ start, ready, intro, waiting }), [start, ready, intro, waiting]);
  return <Context.Provider value={value}>
    <div style={{ display: "contents" }} inert={!!transition}>{children}</div>
    {transition && <Door phase={transition.phase} onClosed={closed} onFinished={finish} />}
    {failure && <div role="status" className="fixed right-4 bottom-4 z-[100] max-w-sm rounded-xl border bg-surface p-4 text-sm shadow-lg">Halaman masih dimuat. <button className="underline" onClick={() => window.location.assign(failure)}>Coba lagi</button><button className="ml-3 underline" onClick={() => setFailure("")}>Tutup</button></div>}
  </Context.Provider>;
}
