"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { FolderOpen, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import type { ProjectPage } from "@/features/projects/contracts";
import { ProjectActions } from "./project-actions";
import { NewProjectAction } from "./new-project-action";

export function ProjectCollection({ data, error, owner, search = "", searchable = false }: { data: ProjectPage | null; error: string | null; owner: string; search?: string; searchable?: boolean }) {
  const router = useRouter();
  const form = useForm<{ search: string }>({ values: { search } });
  const href = (page: number) => `/dashboard/projects?${new URLSearchParams({ search, page: String(page) })}`;
  return <div className="space-y-5">
    {searchable && <form className="flex flex-wrap items-end gap-3" onSubmit={form.handleSubmit(({ search: value }) => router.push(`/dashboard/projects?${new URLSearchParams({ search: value.trim(), page: "1" })}`))}>
      <div className="min-w-0 flex-1 space-y-2"><label htmlFor="project-search" className="text-sm font-medium">Cari di semua proyek akun</label><Input id="project-search" placeholder="Nama proyek" maxLength={200} {...form.register("search")} /></div><Button variant="outline" type="submit"><Search aria-hidden />Cari</Button>
      {search && <Button asChild variant="ghost"><Link href="/dashboard/projects">Hapus pencarian</Link></Button>}
    </form>}
    {error ? <div role="alert" className="space-y-3 rounded-lg border bg-surface p-6"><p>{error}</p><Button variant="outline" onClick={() => router.refresh()}>Coba lagi</Button></div>
      : data && data.items.length === 0 ? <div className="rounded-lg border border-dashed bg-surface px-6 py-12 text-center"><FolderOpen aria-hidden className="mx-auto mb-4 size-8 text-text-tertiary" /><h2 className="text-lg font-semibold">{search ? "Tidak ada proyek yang cocok" : data.page > 1 ? "Tidak ada proyek di halaman ini" : "Belum ada proyek"}</h2><p className="mb-5 mt-2 text-sm text-text-secondary">{search ? "Coba nama lain atau hapus pencarian." : "Mulai rangkaian baru. Proyek akan muncul di sini setelah disimpan ke akun."}</p>{!search && data.page === 1 && <NewProjectAction />}</div>
      : <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">{data?.items.map((project) => <Card key={project.id} className="min-w-0 gap-4 rounded-lg p-5 shadow-none">
        <div className="flex items-start justify-between gap-2"><FolderOpen aria-hidden className="mt-2 size-5 shrink-0 text-primary" /><ProjectActions project={project} owner={owner} /></div>
        <div className="min-w-0"><h3 className="truncate text-base font-semibold" title={project.title}>{project.title}</h3><p className="mt-2 text-xs text-text-secondary">Diperbarui <time dateTime={project.updated_at}>{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeZone: "Asia/Jakarta" }).format(new Date(project.updated_at))}</time></p></div>
        <Button asChild variant="outline" className="mt-2 w-full"><Link href={`/simulator?project=${project.id}`} aria-label={`Buka ${project.title}`}>Buka proyek</Link></Button>
      </Card>)}</div>}
    {searchable && data && (data.page > 1 || data.hasMore) && <nav aria-label="Halaman proyek" className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
      {data.page > 1 ? <Button asChild variant="outline"><Link href={href(data.page - 1)}>Sebelumnya</Link></Button> : <span />}
      <span className="text-sm text-text-secondary">Halaman {data.page}</span>
      {data.hasMore ? <Button asChild variant="outline"><Link href={href(data.page + 1)}>Berikutnya</Link></Button> : <span />}
    </nav>}
  </div>;
}
