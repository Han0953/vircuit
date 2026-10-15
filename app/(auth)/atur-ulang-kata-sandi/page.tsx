import type { Metadata } from "next";
import { cookies } from "next/headers";
import { serverClient } from "@/lib/supabase/server";
import { recoveryCookie, validRecoveryProof } from "@/features/auth/recovery";
import { RecoveryForm } from "@/features/auth/ui/recovery-form";
export const metadata: Metadata = { title: "Atur ulang kata sandi" };
export default async function ResetPage() {
  const client = await serverClient(true);
  const { data: { user } } = await client.auth.getUser();
  const { data: { session } } = await client.auth.getSession();
  const valid = !!user && !!session && validRecoveryProof((await cookies()).get(recoveryCookie)?.value, session.access_token);
  return <RecoveryForm reset valid={valid} />;
}
