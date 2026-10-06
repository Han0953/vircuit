import { ArrowUp, CircuitBoard } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PublicFooter() {
  return (
    <footer className="border-t bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-8">
        <div className="flex flex-col justify-between gap-8 md:flex-row">
          <div className="max-w-sm"><a href="#main-content" className="inline-flex min-h-11 items-center gap-2 rounded-sm text-xl font-bold outline-none focus-visible:ring-2 focus-visible:ring-ring"><CircuitBoard className="size-7 text-primary" aria-hidden="true" />Vircuit</a><p className="mt-3 text-sm leading-relaxed text-text-secondary">Belajar IoT melalui rangkaian, eksperimen, dan pemahaman.</p></div>
          <nav aria-label="Navigasi footer" className="grid grid-cols-2 gap-x-8 gap-y-1 self-start">
            {[["Fitur", "#fitur"], ["Belajar", "#belajar"], ["Jelajahi", "#jelajahi"], ["Harga", "#harga"]].map(([label, href]) => <Button key={href} asChild variant="ghost" className="justify-start"><a href={href}>{label}</a></Button>)}
          </nav>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t pt-6 text-xs text-text-secondary"><p>Vircuit · Trio Hengker Enjoyer</p><Button asChild variant="ghost"><a href="#main-content">Kembali ke atas<ArrowUp aria-hidden="true" /></a></Button></div>
      </div>
    </footer>
  );
}
