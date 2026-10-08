import { create } from "zustand";
import { modeSchema, type CirraMode, type CirraReply, type CirraRequest } from "../contracts";
export type ChatMessage = { id: string; role: "user" | "assistant"; text: string; mode?: CirraMode; createdAt?: number; reply?: CirraReply };
export type CirraLaunch = { mode: CirraMode; problemId?: string; bindings?: CirraRequest["bindings"]; nonce: number; scope?: string };
export type ChatSession = {
  draft: string; mode: CirraMode; hintLevel: number; launchNonce?: number;
  scroll: { top: number; nearBottom: boolean };
  status: "idle" | "pending" | "completed" | "canceled" | "failed" | "rate-limited" | "auth-expired";
  error: string; requestId: string | null;
  retry?: { messageId: string; input: CirraRequest };
};
export const emptySession: ChatSession = { draft: "", mode: "tutor", hintLevel: 1, scroll: { top: 0, nearBottom: true }, status: "idle", error: "", requestId: null };
type SessionState = { threads: Record<string, ChatMessage[]>; sessions: Record<string, ChatSession>; launch: CirraLaunch | null };
export const useCirraSession = create<SessionState>(() => ({ threads: {}, sessions: {}, launch: null }));
export const sessionKey = (owner: string, scope: string) => `${owner}:${scope}`;

function bounded(state: SessionState, key: string): SessionState {
  const keys = new Set([...new Set([...Object.keys(state.sessions), ...Object.keys(state.threads)])].filter((id) => id !== key).slice(-9).concat(key));
  return { ...state, threads: Object.fromEntries(Object.entries(state.threads).filter(([id]) => keys.has(id))), sessions: Object.fromEntries(Object.entries(state.sessions).filter(([id]) => keys.has(id))) };
}
export function ensureSession(owner: string, scope: string, mode: CirraMode = "tutor") {
  const key = sessionKey(owner, scope);
  useCirraSession.setState((state) => {
    if (state.sessions[key]) return state;
    const threads = { ...state.threads };
    const messages = [...(threads[key] ?? [])];
    // Legacy mode threads have no shared timestamp; preserve insertion order and IDs.
    for (const [id, entries] of Object.entries(threads)) {
      const legacyMode = modeSchema.options.find((value) => id === `${key}:${value}`);
      if (!legacyMode) continue;
      messages.push(...entries.map((message) => ({ ...message, mode: message.mode ?? message.reply?.result.mode ?? legacyMode })));
      delete threads[id];
    }
    threads[key] = [...new Map(messages.map((message) => [message.id, message])).values()].slice(-12);
    return bounded({ ...state, threads, sessions: { ...state.sessions, [key]: { ...emptySession, mode } } }, key);
  });
  return key;
}
export function updateSession(key: string, update: Partial<ChatSession> | ((session: ChatSession) => Partial<ChatSession>)) {
  useCirraSession.setState((state) => {
    const current = state.sessions[key];
    if (!current) return state;
    const next = typeof update === "function" ? update(current) : update;
    return bounded({ ...state, sessions: { ...state.sessions, [key]: { ...current, ...next } } }, key);
  });
}
export function setMessages(key: string, messages: ChatMessage[]) {
  useCirraSession.setState((state) => bounded({ ...state, threads: { ...state.threads, [key]: messages.slice(-12) } }, key));
}
export function clearCirraAccount(owner: string) {
  useCirraSession.setState((state) => ({ threads: Object.fromEntries(Object.entries(state.threads).filter(([key]) => !key.startsWith(`${owner}:`))), sessions: Object.fromEntries(Object.entries(state.sessions).filter(([key]) => !key.startsWith(`${owner}:`))), launch: null }));
}
export function clearCirraSessions() { useCirraSession.setState({ threads: {}, sessions: {}, launch: null }); }
export function openCirra(mode: CirraMode, options: Omit<CirraLaunch, "mode" | "nonce"> = {}) {
  useCirraSession.setState({ launch: { mode, ...options, nonce: Date.now() } });
  window.dispatchEvent(new Event("vircuit:open-cirra"));
}
