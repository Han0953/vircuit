import { ThemeToggle } from "@/components/shared/theme-toggle";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-8 sm:py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-h3 font-semibold leading-(--leading-heading)">Vircuit</h1>
        <ThemeToggle />
      </div>
      <p className="text-body-sm leading-(--leading-body) text-text-secondary">
        Foundation awal. Konten halaman belum dibuat.
      </p>
    </main>
  );
}
