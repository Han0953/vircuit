import type { Metadata } from "next";
import { RecoveryForm } from "@/features/auth/ui/recovery-form";
export const metadata: Metadata = { title: "Pemulihan kata sandi" };
export default function RecoveryPage() { return <RecoveryForm />; }
