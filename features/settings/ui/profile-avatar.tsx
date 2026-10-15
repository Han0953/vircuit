"use client";
import { useState } from "react";
import Image from "next/image";
import type { DashboardIdentity } from "@/features/dashboard/ui/user-menu";
import { cn } from "@/lib/utils";

export function ProfileAvatar({ user, className }: { user: DashboardIdentity; className?: string }) {
  const [failedUrl, setFailedUrl] = useState<string | undefined>();
  return <span aria-label={`Avatar ${user.name}`} className={cn("relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-primary/20 bg-primary-soft text-xs font-semibold text-primary", className)}>
    {user.avatarUrl && failedUrl !== user.avatarUrl ? <Image src={user.avatarUrl} alt="" fill unoptimized sizes="64px" className="object-cover" onError={() => setFailedUrl(user.avatarUrl)} /> : user.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}
  </span>;
}
