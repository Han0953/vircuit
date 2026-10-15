export interface AuthEntry { id: string; target: string; expires: number }
export const authEntryCookie = "vircuit-auth-entry";
export const doorDeadline = 1800;

export function transitionTarget(value: string) {
  if (value.length > 300 || !/^\/(?:dashboard(?:\/|$)|simulator(?:\/code)?(?:\?|$))/.test(value) || value.includes("\\")) return "/dashboard";
  return value;
}
export function parseAuthEntry(raw: string | undefined, now = Date.now()): AuthEntry | null {
  try {
    if (!raw || raw.length > 800) return null;
    const value: unknown = JSON.parse(decodeURIComponent(raw));
    if (!value || typeof value !== "object" || !("id" in value) || !("target" in value) || !("expires" in value)) return null;
    const { id, target, expires } = value;
    return typeof id === "string" && /^[a-f0-9-]{36}$/.test(id) && typeof target === "string" && transitionTarget(target) === target && typeof expires === "number" && expires > now && expires <= now + 60_000 ? { id, target, expires } : null;
  } catch { return null; }
}
