import { create } from "zustand";
import type { CirraMode, CirraReply, CirraRequest } from "../contracts";
export type ChatMessage = { id: string; role: "user" | "assistant"; text: string; reply?: CirraReply };
export type CirraLaunch = { mode: CirraMode; problemId?: string; bindings?: CirraRequest["bindings"]; nonce: number };
export const useCirraSession = create<{ threads: Record<string, ChatMessage[]>; launch: CirraLaunch | null }>(() => ({ threads: {}, launch: null }));
export function setMessages(key: string, messages: ChatMessage[]) {
  useCirraSession.setState((state) => {
    const entries = Object.entries(state.threads).filter(([id]) => id !== key).slice(-9);
    return { threads: { ...Object.fromEntries(entries), [key]: messages.slice(-12) } };
  });
}
export function clearCirraAccount(owner: string) {
  useCirraSession.setState((state) => ({ threads: Object.fromEntries(Object.entries(state.threads).filter(([key]) => !key.startsWith(`${owner}:`))), launch: null }));
}
export function openCirra(mode: CirraMode, options: Omit<CirraLaunch, "mode" | "nonce"> = {}) {
  useCirraSession.setState({ launch: { mode, ...options, nonce: Date.now() } });
  window.dispatchEvent(new Event("vircuit:open-cirra"));
}
