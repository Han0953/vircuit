"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { ArrowRight, FolderOpen, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ProjectPage } from "@/features/projects/contracts";
import { ProjectActions } from "./project-actions";
import { NewProjectAction } from "./new-project-action";
import { SchematicThumbnail } from "./schematic-thumbnail";
import { RetryButton } from "./retry-button";

export function ProjectCollection({
  data,
  error,
  owner,
  search = "",
  searchable = false,
}: {
  data: ProjectPage | null;
  error: string | null;
  owner: string;
  search?: string;
  searchable?: boolean;
}) {
  const router = useRouter();
  const form = useForm<{ search: string }>({ values: { search } });
  const href = (page: number) =>
    `/dashboard/projects?${new URLSearchParams({ search, page: String(page) })}`;

  return (
    <div className="space-y-6">
      {searchable && (
        <form
          data-motion="action"
          className="flex flex-wrap items-end gap-3"
          onSubmit={form.handleSubmit(({ search: value }) =>
            router.push(
              `/dashboard/projects?${new URLSearchParams({
                search: value.trim(),
                page: "1",
              })}`
            )
          )}
        >
          <div className="min-w-0 flex-1 space-y-2">
            <label htmlFor="project-search" className="text-sm font-medium text-foreground">
              Cari proyek sirkuit
            </label>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-tertiary"
                aria-hidden="true"
              />
              <Input
                id="project-search"
                placeholder="Cari berdasarkan judul proyek..."
                maxLength={200}
                className="pl-9 pr-4"
                {...form.register("search")}
              />
            </div>
          </div>
          <Button variant="default" type="submit" className="gap-2">
            <Search className="size-4" aria-hidden="true" />
            Cari
          </Button>
          {search && (
            <Button asChild variant="ghost">
              <Link href="/dashboard/projects">Hapus filter</Link>
            </Button>
          )}
        </form>
      )}

      {error ? (
        <Card
          data-motion="card"
          role="alert"
          className="space-y-3.5 border-dashed border-destructive/40 bg-destructive/5 p-6 text-center sm:text-left sm:flex sm:items-center sm:justify-between sm:space-y-0"
        >
          <div className="space-y-1">
            <p className="font-semibold text-destructive">Proyek gagal dimuat</p>
            <p className="text-xs text-text-secondary leading-relaxed">
              {error} Draft lokal tidak diubah.
            </p>
          </div>
          <RetryButton className="gap-2 shrink-0 border-destructive/30 hover:bg-destructive/10" />
        </Card>
      ) : data && data.items.length === 0 ? (
        <div
          data-motion="card"
          className="rounded-xl border border-dashed border-border bg-surface p-8 text-center sm:p-12"
        >
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <FolderOpen className="size-6" aria-hidden="true" />
          </div>
          <h3 className="mt-4 text-lg font-bold tracking-tight text-foreground">
            {search ? "Tidak ada proyek yang sesuai" : "Belum ada proyek tersimpan"}
          </h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-text-secondary leading-relaxed">
            {search
              ? `Tidak ditemukan proyek dengan kata kunci "${search}". Coba kata kunci lain atau hapus pencarian.`
              : "Mulai rakit sirkuit baru di Virtual Lab. Proyek yang kamu simpan akan otomatis muncul di sini."}
          </p>
          {!search && data.page === 1 && (
            <div className="mt-6 flex justify-center">
              <NewProjectAction />
            </div>
          )}
        </div>
      ) : (
        <div className="grid min-w-0 gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
          {data?.items.map((project) => (
            <Card
              key={project.id}
              data-motion="card"
              className="group flex flex-col justify-between overflow-hidden rounded-xl border border-border/70 bg-surface p-4 shadow-xs hover:border-border hover:shadow-md transition-colors"
            >
              <div>
                {/* Procedural schematic visual preview */}
                <SchematicThumbnail title={project.title} />

                <div className="mt-3.5 flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[10px] font-mono font-medium px-1.5 py-0">
                        Rev. {project.revision}
                      </Badge>
                      <span className="text-[11px] text-text-tertiary">
                        {new Intl.DateTimeFormat("id-ID", {
                          dateStyle: "medium",
                          timeZone: "Asia/Jakarta",
                        }).format(new Date(project.updated_at))}
                      </span>
                    </div>
                    <h4
                      className="mt-1.5 truncate text-base font-bold text-foreground group-hover:text-primary transition-colors"
                      title={project.title}
                    >
                      {project.title}
                    </h4>
                  </div>
                  <ProjectActions project={project} owner={owner} />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between gap-2">
                <span className="text-xs text-text-tertiary flex items-center gap-1">
                  <Sparkles className="size-3 text-primary" aria-hidden="true" />
                  Virtual Lab
                </span>
                <Button asChild size="sm" variant="outline" className="gap-1.5 font-medium">
                  <Link href={`/simulator?project=${project.id}`} aria-label={`Buka proyek ${project.title}`}>
                    Buka Proyek
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {searchable && data && (data.page > 1 || data.hasMore) && (
        <nav
          aria-label="Halaman navigasi proyek"
          data-motion="action"
          className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4"
        >
          {data.page > 1 ? (
            <Button asChild variant="outline" size="sm">
              <Link href={href(data.page - 1)}>Sebelumnya</Link>
            </Button>
          ) : (
            <span />
          )}
          <span className="text-xs font-medium text-text-secondary">
            Halaman {data.page}
          </span>
          {data.hasMore ? (
            <Button asChild variant="outline" size="sm">
              <Link href={href(data.page + 1)}>Berikutnya</Link>
            </Button>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
