import { replySchema, requestSchema, type CirraMode, type CirraRequest } from "../contracts";
import { setMessages, updateSession, useCirraSession } from "./session-store";

const errors: Record<number, string> = {
  400: "Aku belum bisa membaca pertanyaan atau konteks ini. Periksa isinya lalu coba lagi.",
  401: "Session kamu berakhir. Masuk kembali sebelum bertanya ke aku.",
  403: "Aku tidak bisa mengakses konteks ini dengan akun kamu.",
  409: "Session akun berubah. Masuk kembali sebelum bertanya ke aku.",
  429: "Aku sedang mencapai batas layanan. Coba lagi sebentar.",
  503: "Layanan aku belum tersedia sekarang. Coba lagi sebentar; project kamu tetap aman.",
  504: "Aku membutuhkan waktu lebih lama. Coba lagi sebentar.",
};
export function createChatRequest(owner: string, key: string, fetcher: typeof fetch = fetch) {
  let active: { id: string; controller: AbortController } | null = null;
  let unsubscribe: (() => void) | null = null;
  const current = () => useCirraSession.getState().sessions[key];
  const owns = (id: string) => active?.id === id && current()?.requestId === id && !active.controller.signal.aborted;
  function watch() {
    unsubscribe ??= useCirraSession.subscribe(() => {
      if (active && current()?.requestId !== active.id) { active.controller.abort(); active = null; }
    });
  }
  async function run(input: CirraRequest) {
    watch();
    const id = input.requestId;
    const controller = new AbortController(); active = { id, controller };
    updateSession(key, { requestId: id, status: "pending", error: "" });
    try {
      const response = await fetcher("/api/ai/cirra", { method: "POST", cache: "no-store", signal: AbortSignal.any([controller.signal, AbortSignal.timeout(55000)]), headers: { "Content-Type": "application/json", "X-Vircuit-Account": owner }, body: JSON.stringify(input) });
      if (!owns(id)) return;
      if (!response.ok) {
        updateSession(key, { status: response.status === 429 ? "rate-limited" : [401, 409].includes(response.status) ? "auth-expired" : "failed", error: errors[response.status] ?? "Aku belum bisa menjawab sekarang. Coba lagi sebentar." });
        return;
      }
      const raw: unknown = await response.json();
      if (!owns(id)) return;
      const reply = replySchema.safeParse(raw);
      if (!reply.success || reply.data.requestId !== id || reply.data.result.mode !== input.mode) {
        updateSession(key, { status: "failed", error: "Jawaban aku belum valid. Coba lagi." }); return;
      }
      setMessages(key, [...(useCirraSession.getState().threads[key] ?? []), { id: crypto.randomUUID(), role: "assistant", text: reply.data.result.answer, mode: input.mode, createdAt: Date.now(), reply: reply.data }]);
      updateSession(key, { status: "completed", error: "", retry: undefined });
    } catch (cause) {
      if (owns(id)) updateSession(key, { status: "failed", error: cause instanceof Error && cause.name === "TimeoutError" ? errors[504] : "Aku belum mendapat jawaban. Periksa koneksi kamu lalu coba lagi." });
    } finally {
      if (active?.id === id) { active = null; updateSession(key, (session) => session.requestId === id ? { requestId: null } : {}); }
    }
  }
  function send(text: string, mode: CirraMode, hintLevel: number, getContext: () => Partial<CirraRequest>) {
    if (active || !current() || current()?.requestId || !text.trim()) return false;
    let input: CirraRequest;
    try {
      const before = useCirraSession.getState().threads[key] ?? [];
      input = requestSchema.parse({ ...structuredClone(getContext()), requestId: crypto.randomUUID(), mode, message: text, hintLevel, history: before.slice(-6).map(({ role, text }) => ({ role, text: text.slice(0, 4000) })) });
    } catch { updateSession(key, { status: "failed", error: errors[400] }); return false; }
    const messageId = crypto.randomUUID();
    setMessages(key, [...(useCirraSession.getState().threads[key] ?? []), { id: messageId, role: "user", text: input.message, mode, createdAt: Date.now() }]);
    updateSession(key, { draft: "", retry: { messageId, input } });
    void run(input);
    return true;
  }
  function retry() {
    const attempt = current()?.retry;
    if (active || current()?.requestId || !attempt || !(useCirraSession.getState().threads[key] ?? []).some((message) => message.id === attempt.messageId)) return false;
    void run({ ...attempt.input, requestId: crypto.randomUUID() }); return true;
  }
  function cancel(error = "Permintaan dibatalkan. Percakapan kamu tetap tersedia.") {
    if (!active) return;
    active.controller.abort(); active = null;
    updateSession(key, { requestId: null, status: "canceled", error });
  }
  return { send, retry, cancel, watch, clear: () => { cancel(); setMessages(key, []); updateSession(key, { status: "idle", error: "", retry: undefined, scroll: { top: 0, nearBottom: true } }); }, dispose: () => { cancel(); unsubscribe?.(); unsubscribe = null; } };
}
