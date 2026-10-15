"use client";
import { RetryButton } from "@/features/dashboard/ui/retry-button";
export function ProgressError({ message }: { message: string }) {
  return <div data-motion="notice" role="alert" className="space-y-3 rounded-md border p-4 text-sm"><p>{message}</p><RetryButton /></div>;
}
