"use client";
import { useEffect, useMemo, useState } from "react";
import type { CirraMode, CirraRequest } from "../contracts";
import { clearCirraAccount, emptySession, ensureSession, sessionKey, useCirraSession, type ChatMessage } from "./session-store";
import { createChatRequest } from "./chat-request";
const empty: ChatMessage[] = [];
export function useChat(owner: string, scope: string, initialMode: CirraMode, getContext: () => Partial<CirraRequest>) {
  const key = sessionKey(owner, scope);
  const messages = useCirraSession((state) => state.threads[key] ?? empty);
  const session = useCirraSession((state) => state.sessions[key] ?? emptySession);
  const [authInvalid, setAuthInvalid] = useState(false);
  const request = useMemo(() => createChatRequest(owner, key), [owner, key]);
  useEffect(() => { ensureSession(owner, scope, initialMode); }, [owner, scope, initialMode]);
  useEffect(() => { request.watch(); return request.dispose; }, [request]);
  useEffect(() => {
    const channel = new BroadcastChannel("vircuit-auth");
    channel.onmessage = () => { request.cancel(); clearCirraAccount(owner); setAuthInvalid(true); };
    return () => channel.close();
  }, [owner, request]);
  return { key, messages, session, unavailable: authInvalid, pending: session.status === "pending", error: authInvalid ? "Session akun kamu berubah. Masuk kembali sebelum bertanya ke aku." : session.error, send: (text: string) => !authInvalid && request.send(text, session.mode, session.hintLevel, getContext), retry: () => !authInvalid && request.retry(), cancel: () => request.cancel(), clear: request.clear };
}
