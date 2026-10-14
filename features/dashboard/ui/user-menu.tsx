"use client";
import Link from "next/link";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ThemePopover } from "./theme-popover";
import { ProfileAvatar } from "@/features/settings/ui/profile-avatar";

export type DashboardIdentity = { id: string; name: string; email: string; avatarUrl?: string };
export function UserMenu({ user }: { user: DashboardIdentity }) {
  return <div className="flex items-center gap-1.5">
    <ThemePopover />
    <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label="Menu akun"><ProfileAvatar user={user} /></Button></DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-w-[calc(100vw-2rem)]">
        <DropdownMenuLabel className="max-w-64 break-all">{user.name}<span className="block text-xs font-normal text-text-secondary">{user.email}</span></DropdownMenuLabel>
        <DropdownMenuSeparator /><DropdownMenuItem asChild><Link href="/dashboard/pengaturan"><Settings2 aria-hidden />Pengaturan</Link></DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>;
}
