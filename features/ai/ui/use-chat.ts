"use client";
import { useEffect, useRef, useState } from "react";
import { replySchema, type CirraMode, type CirraRequest } from "../contracts";
import { clearCirraAccount, setMessages, useCirraSession, type ChatMessage } from "./session-store";
const empty: ChatMessage[] = [];
export function useChat(owner: string, scope: string, mode: CirraMode, getContext: () => Partial<CirraRequest>) {
  const key = `${owner}:${scope}:${mode}`;
  const messages = useCirraSession((s) => s.threads[key] ?? empty);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [lastQuestion, setLastQuestion] = useState("");
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => { controller.current?.abort(); controller.current = null; }, [key]);
  useEffect(() => {
    const channel = new BroadcastChannel("vircuit-auth");
    channel.onmessage = () => {
      controller.current?.abort(); controller.current = null;
      clearCirraAccount(owner); setPending(false); setError("Session akun berubah. Masuk kembali sebelum bertanya ke Cirra.");
    };
    return () => channel.close();
  }, [owner]);
  async function send(text: string, hintLevel: number) {
    if (controller.current || !text.trim()) return;
    const abort = new AbortController(); controller.current = abort;
    setPending(true); setError(""); setLastQuestion(text);
    const before = useCirraSession.getState().threads[key] ?? [];
    const current = [...before, { id: crypto.randomUUID(), role: "user" as const, text }];
    setMessages(key, current);
    try {
      const input = { ...getContext(), requestId: crypto.randomUUID(), mode, message: text, hintLevel, history: before.slice(-6).map(({ role, text }) => ({ role, text: text.slice(0, 4000) })) };
      const response = await fetch("/api/ai/cirra", { method: "POST", cache: "no-store", signal: AbortSignal.any([abort.signal, AbortSignal.timeout(55000)]), headers: { "Content-Type": "application/json", "X-Vircuit-Account": owner }, body: JSON.stringify(input) });
      const raw: unknown = await response.json();
      if (!response.ok) throw new Error(raw && typeof raw === "object" && "error" in raw && typeof raw.error === "string" ? raw.error : "Aku belum bisa menjawab sekarang.");
      const parsed = replySchema.safeParse(raw);
      if (!parsed.success) throw new Error("Jawaban Cirra belum valid. Coba lagi.");
      const reply = parsed.data;
      if (reply.requestId !== input.requestId || reply.result.mode !== mode) throw new Error("Jawaban belum sesuai permintaan. Coba lagi.");
      if (!abort.signal.aborted) setMessages(key, [...current, { id: crypto.randomUUID(), role: "assistant", text: reply.result.answer, reply }]);
    } catch (cause) {
      if (!abort.signal.aborted) setError(cause instanceof Error && cause.name !== "AbortError" ? cause.message : "Aku belum mendapat jawaban sekarang. Coba lagi sebentar.");
    } finally { if (controller.current === abort) { controller.current = null; setPending(false); } }
  }
  return { messages, pending, error, lastQuestion, send, cancel: () => { controller.current?.abort(); controller.current = null; setPending(false); setError("Permintaan dibatalkan. Percakapan sebelumnya tetap tersedia."); }, clear: () => { controller.current?.abort(); controller.current = null; setPending(false); setMessages(key, []); setError(""); setLastQuestion(""); } };
}
