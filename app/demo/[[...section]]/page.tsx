import Link from "next/link";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { BookOpen, FolderOpen, LockKeyhole, Sparkles, ChartNoAxesColumn, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DashboardMotionSection } from "@/features/dashboard/motion/dashboard-motion";
import { learningCatalog } from "@/features/learning/registry";
import { challengeCatalog } from "@/features/challenges/registry";
import { dashboardLinks, demoHref } from "@/features/dashboard/navigation";

function SignIn({ target, children = "Masuk untuk menggunakan fitur ini" }: { target: string; children?: ReactNode }) {
  return <Button asChild className="mt-4"><Link href={`/masuk?next=${encodeURIComponent(target)}`}><LockKeyhole aria-hidden className="size-4" />{children}</Link></Button>;
}

export default async function DemoPage({ params }: { params: Promise<{ section?: string[] }> }) {
  const segments = (await params).section ?? [];
  const section = segments.join("/");
  const link = dashboardLinks.find((item) => demoHref(item.href) === (section ? `/demo/${section}` : "/demo"));
  if (!link) notFound();
  const courses = learningCatalog();
  return <DashboardMotionSection className="space-y-6">
    <header data-motion="header"><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{section ? link.label : "Halo, Pengunjung!"}</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">{section ? "Lihat fitur yang tersedia. Masuk ke akun untuk mulai menggunakannya." : "Lihat ruang belajar Vircuit. Masuk untuk menyimpan proyek, bertanya ke Cirra, dan mencatat progresmu."}</p></header>
    {!section && <><div className="grid gap-4 sm:grid-cols-2">{[
      { href: "/demo/learn", title: "Mulai belajar", text: "Elektronika dasar, pemrograman, dan latihan rangkaian.", icon: BookOpen },
      { href: "/demo/projects", title: "Proyek Saya", text: "Simpan dan buka kembali rangkaian di akunmu.", icon: FolderOpen },
      { href: "/demo/cirra", title: "Tanya Cirra", text: "Bahas konsep atau susun ide proyek bersama AI.", icon: Sparkles },
      { href: "/demo/progress", title: "Progress", text: "Lihat pelajaran dan tantangan yang sudah diselesaikan.", icon: ChartNoAxesColumn },
    ].map(({ href, title, text, icon: Icon }) => <Card key={href} data-motion="card" className="p-5"><Icon aria-hidden className="size-6 text-primary" /><h2 className="mt-3 font-semibold">{title}</h2><p className="mt-2 text-sm text-text-secondary">{text}</p><Button asChild variant="outline" className="mt-4"><Link href={href}>Lihat {title}</Link></Button></Card>)}</div><Card data-motion="card" className="p-5"><h2 className="font-semibold">Proyek baru</h2><p className="mt-2 text-sm text-text-secondary">Buat akun atau masuk untuk menyimpan rangkaianmu. Virtual Lab tetap bisa digunakan tanpa akun melalui header.</p><SignIn target="/dashboard/projects">Masuk untuk membuat proyek</SignIn></Card></>}
    {section === "learn" && <div className="grid gap-4 lg:grid-cols-2">{courses.map((course) => <Card key={course.id} data-motion="card" className="p-5"><h2 className="text-lg font-semibold">{course.title}</h2><p className="mt-2 text-sm text-text-secondary">{course.description}</p><ul className="mt-4 space-y-3">{course.modules.map((module) => <li key={module.id}><h3 className="font-medium">{module.title}</h3><ul className="mt-2 space-y-2 text-sm text-text-secondary">{course.lessons.filter((lesson) => lesson.moduleId === module.id).map((lesson) => <li key={lesson.id}>{lesson.title}</li>)}</ul></li>)}</ul><SignIn target={`/dashboard/learn/${course.slug}`}>Masuk untuk mulai belajar</SignIn></Card>)}</div>}
    {section === "challenges" && <div className="grid gap-4 sm:grid-cols-2">{challengeCatalog().map((challenge) => <Card key={challenge.id} data-motion="card" className="p-5"><h2 className="font-semibold">{challenge.title}</h2><p className="mt-2 text-sm text-text-secondary">{challenge.objective}</p><SignIn target="/dashboard/challenges">Masuk untuk mengerjakan</SignIn></Card>)}</div>}
    {section === "projects" && <Card data-motion="card" className="p-6"><FolderOpen aria-hidden className="size-8 text-primary" /><h2 className="mt-4 text-lg font-semibold">Proyekmu ada di akunmu</h2><p className="mt-2 text-sm text-text-secondary">Masuk untuk membuka, membuat, atau mengelola proyek. Tidak ada proyek pribadi yang ditampilkan di demo.</p><SignIn target="/dashboard/projects" /></Card>}
    {section === "progress" && <Card data-motion="card" className="p-6"><ChartNoAxesColumn aria-hidden className="size-8 text-primary" /><h2 className="mt-4 text-lg font-semibold">Catat perjalanan belajarmu</h2><p className="mt-2 text-sm text-text-secondary">Setelah masuk, pelajaran dan tantangan yang kamu selesaikan akan muncul di sini.</p><SignIn target="/dashboard/progress" /></Card>}
    {section === "cirra" && <Card data-motion="card" className="p-5"><div className="flex items-center gap-2"><Sparkles aria-hidden className="size-5 text-ai" /><h2 className="font-semibold">Cirra</h2></div><p className="mt-4 max-w-xl rounded-2xl border bg-surface-muted p-4 text-sm leading-relaxed">Aku Cirra. Kamu bisa bertanya tentang elektronika, kode Arduino, atau ide proyek IoT. Masuk dulu untuk mulai ngobrol denganku.</p><SignIn target="/dashboard/cirra">Masuk untuk bertanya</SignIn></Card>}
    {section === "pengaturan" && <Card data-motion="card" className="p-5"><Settings2 aria-hidden className="size-6 text-primary" /><h2 className="mt-3 font-semibold">Atur akun dan ruang kerjamu</h2><p className="mt-2 text-sm text-text-secondary">Profil, keamanan akun, tampilan, Virtual Lab, pembelajaran, dan data pribadi.</p><p className="mt-3 text-sm text-text-secondary">Tema bisa kamu ganti dari header. Pengaturan akun tersedia setelah masuk.</p><SignIn target="/dashboard/pengaturan" /></Card>}
  </DashboardMotionSection>;
}
