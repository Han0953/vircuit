"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { saveResultSchema, titleSchema, type ProjectSummary } from "@/features/projects/contracts";
import { CloudError, cloudRequest } from "@/features/projects/cloud/request";
import { detachDeletedProject } from "@/features/projects/local/account-actions";

export function ProjectActions({ project, owner }: { project: ProjectSummary; owner: string }) {
  const [action, setAction] = useState<"rename" | "delete" | null>(null);
  return <>
    <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={`Tindakan ${project.title}`}><MoreHorizontal aria-hidden /></Button></DropdownMenuTrigger>
      <DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => setAction("rename")}><Pencil aria-hidden />Ubah nama</DropdownMenuItem><DropdownMenuItem onSelect={() => setAction("delete")}><Trash2 aria-hidden />Hapus</DropdownMenuItem></DropdownMenuContent>
    </DropdownMenu>
    {action && <ProjectActionDialog key={`${action}:${project.revision}`} action={action} project={project} owner={owner} close={() => setAction(null)} />}
  </>;
}
function ProjectActionDialog({ action, project, owner, close }: { action: "rename" | "delete"; project: ProjectSummary; owner: string; close: () => void }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(false);
  const [confirmedDelete, setConfirmedDelete] = useState(false);
  const operation = useRef<{ title: string; operationId: string; draftId: string } | null>(null);
  const form = useForm<{ title: string }>({ resolver: zodResolver(z.object({ title: titleSchema })), defaultValues: { title: project.title } });
  async function submit(title?: string) {
    setPending(true); setError(""); setConflict(false);
    let deleted = confirmedDelete;
    try {
      if (action === "rename" && title) {
        if (operation.current?.title !== title) operation.current = { title, operationId: crypto.randomUUID(), draftId: crypto.randomUUID() };
        saveResultSchema.parse(await cloudRequest(`/api/projects/${project.id}`, "PATCH", { ...operation.current, expectedRevision: project.revision }));
      } else {
        if (!confirmedDelete) {
          await cloudRequest(`/api/projects/${project.id}`, "DELETE", { expectedRevision: project.revision });
          setConfirmedDelete(true);
          deleted = true;
        }
        await detachDeletedProject(owner, project.id);
        const channel = new BroadcastChannel("vircuit-projects"); channel.postMessage({ type: "deleted", owner, id: project.id }); channel.close();
      }
      router.refresh(); close();
    } catch (cause) {
      if (cause instanceof CloudError && cause.status === 401) { router.replace("/masuk?next=/dashboard/projects"); return; }
      setConflict(cause instanceof CloudError && cause.status === 409);
      setError(deleted ? "Proyek cloud sudah dihapus, tetapi draft lokal belum dapat dilepaskan. Coba lagi untuk menyelesaikan pemulihan lokal." : cause instanceof Error ? cause.message : "Perubahan belum berhasil.");
    } finally { setPending(false); }
  }
  return <Dialog open onOpenChange={(open) => { if (!open && !pending) close(); }}><DialogContent className="max-h-[90dvh] overflow-y-auto">
    <DialogHeader><DialogTitle>{action === "rename" ? "Ubah nama proyek" : "Hapus proyek?"}</DialogTitle><DialogDescription className="break-words">{action === "rename" ? "Nama diperbarui setelah berhasil disimpan ke akun." : `“${project.title}” beserta riwayat cloud akan dihapus permanen. Rangkaian aktif di perangkat ini dipertahankan sebagai draft lokal.`}</DialogDescription></DialogHeader>
    <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); if (action === "rename") void form.handleSubmit(({ title }) => submit(title))(event); else void submit(); }}>
      {action === "rename" && <div className="space-y-2"><label htmlFor={`title-${project.id}`} className="text-sm font-medium">Nama proyek</label><Input id={`title-${project.id}`} maxLength={200} disabled={pending} aria-invalid={!!form.formState.errors.title} aria-describedby={`title-error-${project.id}`} {...form.register("title")} /><p id={`title-error-${project.id}`} className="text-sm text-destructive">{form.formState.errors.title && "Nama harus berisi 1–200 karakter."}</p></div>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {conflict && <Button type="button" variant="outline" onClick={() => { router.refresh(); close(); }}>Muat versi terbaru</Button>}
      <div className="flex flex-wrap gap-2"><Button type="submit" variant={action === "delete" ? "destructive" : "default"} disabled={pending || conflict}>{pending ? "Memproses…" : action === "rename" ? "Simpan nama" : confirmedDelete ? "Pulihkan draft lokal" : "Hapus proyek"}</Button><Button type="button" variant="outline" disabled={pending} onClick={close}>Batal</Button></div>
    </form>
  </DialogContent></Dialog>;
}
