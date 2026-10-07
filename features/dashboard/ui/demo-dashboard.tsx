"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { FolderOpen } from "lucide-react";
import { DEMO_OWNER, isLocalDemo } from "@/features/auth/demo";
import { listDemoProjects, renameDemoProject, deleteDemoProject } from "@/features/projects/local/demo-projects";
import { titleSchema } from "@/features/projects/contracts";
import { usePersistence } from "@/features/projects/store";
import { replaceDraft } from "@/features/projects/local/controller";
import { newDraft, type Draft } from "@/features/projects/local/drafts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DashboardShell } from "./dashboard-shell";
import { NewProjectAction } from "./new-project-action";
import { ProjectSkeleton } from "./project-skeleton";

export function DemoDashboard({ all = false }: { all?: boolean }) {
  const [projects, setProjects] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [action, setAction] = useState<{ kind: "rename" | "delete"; draft: Draft } | null>(null);
  const [pending, setPending] = useState(false);
  const form = useForm<{ title: string }>({ defaultValues: { title: "" } });
  async function reload() {
    setLoading(true); setError("");
    try { setProjects(await listDemoProjects()); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Proyek lokal gagal dimuat."); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    if (!isLocalDemo()) { window.location.replace("/masuk"); return; }
    const timer = setTimeout(() => { void reload(); }, 0);
    return () => clearTimeout(timer);
  }, []);
  async function mutate(title?: string) {
    if (!action || pending) return;
    setPending(true); setError("");
    try {
      const active = usePersistence.getState().draft;
      if (active?.id === action.draft.id && active.savedLocalRevision !== active.localRevision) {
        throw new Error("Simpan perubahan draft aktif di simulator sebelum mengubah atau menghapus proyek ini.");
      }
      if (action.kind === "rename") await renameDemoProject(action.draft.id, titleSchema.parse(title));
      else await deleteDemoProject(action.draft.id);
      if (active?.id === action.draft.id) {
        await replaceDraft(action.kind === "delete" ? newDraft(active.scope, active.project) : { ...active, project: { ...active.project, metadata: { name: title! } } });
      }
      setAction(null); await reload();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Perubahan gagal."); }
    finally { setPending(false); }
  }
  const filtered = projects.filter((d) => d.project.metadata.name.toLocaleLowerCase("id").includes(search.toLocaleLowerCase("id")));
  const visible = all ? filtered : filtered.slice(0, 6);
  return <DashboardShell demo user={{ id: DEMO_OWNER, name: "Pengguna Testing Lokal", email: "" }}>
    <div className="rounded-md border bg-primary-soft p-3 text-sm">Demo development · Pengguna Testing Lokal · Data hanya disimpan di browser ini, tanpa Supabase.</div>
    <div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-2xl font-semibold">{all ? "Proyek Saya" : "Halo, Pengguna Testing Lokal"}</h1><p className="mt-2 text-sm text-text-secondary">Simpan rangkaian dari simulator untuk melihatnya di sini.</p></div><NewProjectAction /></div>
    {all ? <div className="space-y-2"><label htmlFor="demo-search">Cari proyek lokal</label><Input id="demo-search" value={search} onChange={(event) => setSearch(event.target.value)} /></div> : <div className="flex justify-between gap-3"><h2 className="font-semibold">Proyek terbaru</h2><Link className="text-primary underline" href="/demo/projects">Lihat semua proyek</Link></div>}
    {error && <div role="alert" className="space-y-2"><p>{error}</p><Button variant="outline" onClick={() => void reload()}>Coba lagi</Button></div>}
    {loading ? <ProjectSkeleton /> : !visible.length ? <div className="rounded-lg border border-dashed p-8 text-center"><h2 className="font-semibold">{search ? "Tidak ada proyek yang cocok" : "Belum ada proyek"}</h2><p className="mt-2 text-sm text-text-secondary">Data demo tetap tersedia setelah refresh dan keluar demo.</p></div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visible.map((draft) => <Card key={draft.id} className="min-w-0 p-5"><FolderOpen aria-hidden className="text-primary" /><h2 className="truncate font-semibold" title={draft.project.metadata.name}>{draft.project.metadata.name}</h2><p className="text-xs text-text-secondary">{new Date(draft.updatedAt).toLocaleString("id-ID")}</p><Button asChild variant="outline"><Link href={`/simulator?project=${draft.id}`}>Buka proyek</Link></Button><div className="flex flex-wrap gap-2"><Button variant="ghost" onClick={() => { form.reset({ title: draft.project.metadata.name }); setAction({ kind: "rename", draft }); }}>Ubah nama</Button><Button variant="ghost" onClick={() => setAction({ kind: "delete", draft })}>Hapus</Button></div></Card>)}</div>}
    <Dialog open={!!action} onOpenChange={(open) => { if (!open && !pending) setAction(null); }}><DialogContent className="max-h-[90dvh] overflow-y-auto"><DialogHeader><DialogTitle>{action?.kind === "rename" ? "Ubah nama proyek lokal" : "Hapus proyek lokal"}</DialogTitle><DialogDescription>{action?.draft.project.metadata.name}</DialogDescription></DialogHeader>
      {error && <p role="alert">{error}</p>}
      {action?.kind === "rename" ? <form className="space-y-3" onSubmit={form.handleSubmit(({ title }) => void mutate(title.trim()))}><label htmlFor="demo-title">Nama proyek</label><Input id="demo-title" maxLength={200} disabled={pending} {...form.register("title", { validate: (value) => titleSchema.safeParse(value).success || "Judul harus berisi 1–200 karakter." })} /><p role="alert" className="text-sm text-destructive">{form.formState.errors.title?.message}</p><Button disabled={pending} type="submit">{pending ? "Menyimpan…" : "Simpan nama"}</Button></form> : <><p className="text-sm">Hapus salinan tersimpan dari browser ini?</p><Button disabled={pending} onClick={() => void mutate()}>{pending ? "Menghapus…" : "Hapus proyek"}</Button></>}
    </DialogContent></Dialog>
  </DashboardShell>;
}
