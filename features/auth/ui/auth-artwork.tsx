import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function AuthArtwork({ register, switchHref, busy }: { register: boolean; switchHref: string; busy: boolean }) {
  return <aside data-auth-art className="auth-artwork">
    <div data-auth-art-copy><p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">Belajar melalui eksperimen</p><h2 className="mt-4 max-w-xs text-3xl leading-tight font-semibold tracking-tight">{register ? "Ruang belajarmu, siap dilanjutkan." : "Ide kecil. Kemungkinan besar."}</h2><p className="mt-4 max-w-xs text-sm leading-relaxed text-text-secondary">Rangkai komponen, tulis kode, dan lihat idemu bekerja di Virtual Lab.</p></div>
    <svg aria-hidden viewBox="0 0 400 280" fill="none" className="my-8 w-full text-primary">
      <defs><pattern id="auth-grid" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="currentColor" opacity=".15" /></pattern></defs><rect width="400" height="280" fill="url(#auth-grid)" />
      <g stroke="currentColor" strokeWidth="1.5" opacity=".5"><path data-auth-trace d="M0 80h65l35 35h50M400 200h-65l-35-35h-50M0 225h100l50-50M400 55H300l-50 50" /><path data-auth-trace d="M200 0v80M200 200v80M0 140h145M255 140h145" /></g>
      <rect x="145" y="80" width="110" height="120" rx="16" fill="var(--surface)" stroke="currentColor" strokeOpacity=".4" /><rect x="160" y="95" width="80" height="90" rx="9" fill="var(--primary-soft)" />
      {[110, 130, 150, 170].map((y) => <g key={y} stroke="currentColor" opacity=".65"><path d={`M132 ${y}h13M255 ${y}h13`} /><circle cx="125" cy={y} r="2" /><circle cx="275" cy={y} r="2" /></g>)}
      <path d="M180 140h12l7-18 9 36 7-18h10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /><circle cx="65" cy="80" r="5" fill="var(--surface)" stroke="currentColor" /><circle cx="335" cy="200" r="5" fill="var(--surface)" stroke="currentColor" />
      <text x="200" y="225" fill="currentColor" textAnchor="middle" fontSize="10" letterSpacing="3">LEARN · BUILD · SIMULATE</text>
    </svg>
    <div data-auth-art-copy><p className="mb-3 text-sm text-text-secondary">{register ? "Sudah punya akun?" : "Mulai perjalanan belajarmu."}</p><Button asChild variant="outline" className="min-h-11"><Link aria-disabled={busy} tabIndex={busy ? -1 : undefined} onClick={(event) => { if (busy) event.preventDefault(); }} href={switchHref}>{register ? "Masuk ke akun" : "Buat akun"}<ArrowUpRight aria-hidden /></Link></Button></div>
  </aside>;
}
