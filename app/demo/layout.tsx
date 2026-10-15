import type { ReactNode } from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { authEntryCookie, parseAuthEntry } from "@/features/auth/motion/transition-contract";
import { DemoShell } from "@/features/dashboard/ui/demo-shell";

export const metadata: Metadata = { title: "Jelajahi Dashboard — Vircuit", robots: { index: false, follow: false } };
export default async function DemoLayout({ children }: { children: ReactNode }) {
  const entry = parseAuthEntry((await cookies()).get(authEntryCookie)?.value);
  return <DemoShell authEntry={entry?.target === "/demo" ? entry : null}>{children}</DemoShell>;
}
