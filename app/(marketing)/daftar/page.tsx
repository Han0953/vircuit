import type { Metadata } from "next";
import { AuthForm } from "@/features/auth/ui/auth-form";
export const metadata: Metadata = { title: "Daftar", description: "Buat akun untuk menyimpan rangkaian Vircuit." };
export default async function DaftarPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  return <AuthForm register next={(await searchParams).next} />;
}
