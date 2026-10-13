"use client";
import { createContext, useContext, useSyncExternalStore } from "react";
import { defaultPreferences, preferencesSchema, type Preferences } from "./contracts";

export const PreferenceOwner = createContext<string | null>(null);
const eventName = "vircuit-preferences";
const cache = new Map<string, { raw: string | null; value: Preferences }>();
export const preferenceKey = (owner: string) => `vircuit-preferences-v1:${owner}`;
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(eventName, callback);
  return () => { window.removeEventListener("storage", callback); window.removeEventListener(eventName, callback); };
}
function snapshot(owner: string | null): Preferences {
  if (!owner) return defaultPreferences;
  let raw: string | null;
  try { raw = localStorage.getItem(preferenceKey(owner)); } catch { return defaultPreferences; }
  const previous = cache.get(owner);
  if (previous?.raw === raw) return previous.value;
  let value = defaultPreferences;
  try { const result = preferencesSchema.safeParse(JSON.parse(raw ?? "null")); if (result.success) value = result.data; } catch { /* Invalid local data falls back to validated defaults. */ }
  cache.set(owner, { raw, value });
  return value;
}
export function savePreferences(owner: string, value: Preferences) {
  localStorage.setItem(preferenceKey(owner), JSON.stringify(preferencesSchema.parse(value)));
  window.dispatchEvent(new Event(eventName));
}
export function clearPreferences(owner: string) {
  localStorage.removeItem(preferenceKey(owner));
  window.dispatchEvent(new Event(eventName));
}
export function usePreferences(explicitOwner?: string | null) {
  const contextOwner = useContext(PreferenceOwner);
  const owner = explicitOwner === undefined ? contextOwner : explicitOwner;
  return useSyncExternalStore(subscribe, () => snapshot(owner), () => defaultPreferences);
}
function subscribeMotion(callback: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
export function useReducedMotion() {
  const { motion } = usePreferences();
  const system = useSyncExternalStore(subscribeMotion, () => window.matchMedia("(prefers-reduced-motion: reduce)").matches, () => true);
  return motion === "reduced" || (motion === "system" && system);
}
