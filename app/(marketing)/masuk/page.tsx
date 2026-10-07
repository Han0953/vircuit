import type { Metadata } from "next";
import { AuthForm } from "@/features/auth/ui/auth-form";
export const metadata: Metadata = { title: "Masuk", description: "Masuk untuk menyimpan proyek Vircuit." };
export default async function MasukPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const params = await searchParams;
  return <AuthForm next={params.next} callbackError={!!params.error} />;
}
