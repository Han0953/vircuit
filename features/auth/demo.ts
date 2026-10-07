export const DEMO_OWNER = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const key = "vircuit-demo-active";
export function isLocalDemo() {
  return process.env.NODE_ENV === "development" && typeof window !== "undefined" && localStorage.getItem(key) === "1";
}
export function enterLocalDemo() {
  if (process.env.NODE_ENV !== "development") throw new Error("Demo hanya tersedia saat development.");
  localStorage.setItem(key, "1");
}
export function exitLocalDemo() { localStorage.removeItem(key); }
