"use client";
import { useId, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Send, Square, RotateCcw, Trash2, Ellipsis, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { modeSchema, type CirraMode, type CirraRequest } from "../contracts";
import { useChat } from "./use-chat";
import { updateSession } from "./session-store";
import { desktopChatInput, enterSubmits } from "./chat-input";
import { ProjectBlueprint } from "./project-blueprint";
import { useChatScroll } from "./use-chat-scroll";
import { ChatBubble } from "./chat-message";
const formSchema = z.object({ message: z.string().trim().min(1, "Tulis pertanyaan dulu.").max(2000, "Maksimal 2000 karakter.") });
const labels: Record<CirraMode, string> = { tutor: "Tutor", debugger: "Debugger", "project-assistant": "Project Assistant" };
function referenceLabel(value: string) {
  const line = value.match(/^line[.:](\d+)$/);
  if (line) return `Baris ${line[1]}`;
  if (/lesson|learning/.test(value)) return "Materi lesson";
  if (/challenge|evaluation|attempt/.test(value)) return "Tantangan dan evaluasi";
  if (/runtime|serial/.test(value)) return "Hasil simulasi";
  if (/problem|diagnostic/.test(value)) return "Diagnostik rangkaian";
  if (/catalog/.test(value)) return "Katalog komponen";
  if (/code|parser/.test(value)) return "Kode dan pemeriksaan";
  return "Rangkaian project";
}
export function CirraChat({ owner, scope, contextLabel, initialMode = "tutor", active = true, getContext }: { owner: string; scope: string; contextLabel: string; initialMode?: CirraMode; active?: boolean; getContext: () => Partial<CirraRequest> }) {
  const id = useId();
  const chat = useChat(owner, scope, initialMode, getContext);
  const { session } = chat;
  const composing = useRef(false), touch = useRef(false);
  const { log: logRef, remember, jump } = useChatScroll(chat.key, chat.messages, active);
  const [restored] = useState(() => new Set(chat.messages.map((message) => message.id)));
  const values = useMemo(() => ({ message: session.draft }), [session.draft]);
  const form = useForm<z.infer<typeof formSchema>>({ resolver: zodResolver(formSchema), values });
  const registration = form.register("message");
  const submit = form.handleSubmit(({ message }) => { if (chat.send(message)) form.reset({ message: "" }); });
  return <section aria-label="Percakapan Cirra" className="cirra-chat flex h-full min-h-0 min-w-0 flex-col bg-background">
    <p className="sr-only">Konteks: {contextLabel}</p>
    <div ref={logRef} onScroll={remember} aria-label="Riwayat percakapan" role="log" aria-live="off" aria-busy={chat.pending} className="relative min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-3">
      {!chat.messages.length && <div className="py-4 text-sm leading-relaxed"><p>Aku Cirra, AI pendamping belajar kamu. Mau bertanya konsep, memeriksa rangkaian, atau merencanakan project?</p></div>}
      {chat.messages.map((message) => <ChatBubble key={message.id} message={message} fresh={message.createdAt !== undefined && !restored.has(message.id)} active={active}>
        <p className="text-xs font-medium text-text-secondary">{message.role === "user" ? "Kamu" : "Cirra"}</p><p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{message.text}</p>
        {message.reply && <><ul className="list-disc space-y-1 pl-5">{[...message.reply.result.observations, ...message.reply.result.suggestions, ...message.reply.result.hints].map((text, index) => <li key={index} className="break-words [overflow-wrap:anywhere]">{text}</li>)}</ul>{message.reply.result.blueprint && <ProjectBlueprint plan={message.reply.result.blueprint} />}
          {message.reply.context.sources.length > 0 && <details className="text-xs text-text-secondary"><summary className="min-h-11 cursor-pointer py-3 focus-visible:ring-2 focus-visible:ring-ring">Konteks jawaban</summary><p>{[...new Set([...message.reply.context.sources, ...message.reply.result.references].map(referenceLabel))].join(" · ")}</p>{message.reply.context.truncated.length > 0 && <p>Konteks dipersingkat agar tetap relevan.</p>}</details>}</>}
      </ChatBubble>)}
    </div>
    {!session.scroll.nearBottom && chat.messages.length > 0 && <Button type="button" className="mx-auto my-1 shrink-0" variant="outline" onClick={jump}><ArrowDown aria-hidden />Ke pesan terbaru</Button>}
    <div role="status" aria-live="polite" className="sr-only">{chat.pending ? "Cirra sedang menyiapkan jawaban." : session.status === "completed" ? "Jawaban Cirra tersedia." : session.status === "canceled" ? "Permintaan dibatalkan." : ""}</div>
    {chat.pending && <div aria-hidden className="cirra-typing flex shrink-0 items-center gap-1 px-4 py-3 text-text-secondary" data-active={active}><span /><span /><span /></div>}
    {chat.error && <div role="alert" className="max-h-32 min-h-6 overflow-y-auto px-3 py-2 text-sm"><p>{chat.error}</p>{session.retry && <Button type="button" className="mt-2" disabled={chat.pending} variant="outline" onClick={chat.retry}><RotateCcw aria-hidden />Coba lagi</Button>}</div>}
    <form className="cirra-composer shrink-0 border-t bg-background p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]" onSubmit={submit}>
      <div className="rounded-xl border bg-surface p-2 focus-within:ring-2 focus-within:ring-ring">
        <label htmlFor={`${id}-message`} className="sr-only">Pertanyaan untuk Cirra</label>
        <textarea id={`${id}-message`} disabled={chat.pending || chat.unavailable} rows={2} maxLength={2000} placeholder="Tanya atau ceritakan idemu…" className="block max-h-32 min-h-14 w-full resize-none bg-transparent px-1 py-2 text-base outline-none lg:text-sm" {...registration}
          onChange={(event) => { void registration.onChange(event); updateSession(chat.key, { draft: event.target.value }); }}
          onPointerDown={(event) => { touch.current = event.pointerType === "touch"; }}
          onCompositionStart={() => { composing.current = true; }} onCompositionEnd={() => { composing.current = false; }}
          onKeyDown={(event) => { if (enterSubmits({ key: event.key, shift: event.shiftKey, composing: composing.current || event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229, desktop: desktopChatInput(), touch: touch.current }) && session.draft.trim()) { event.preventDefault(); void submit(); } }} />
        <div className="flex min-w-0 items-center justify-between gap-2">
          <label htmlFor={`${id}-mode`} className="sr-only">Mode</label>
          <div className="flex min-w-0 items-center"><select aria-label="Mode" id={`${id}-mode`} className="min-h-11 min-w-0 max-w-44 rounded-lg bg-transparent px-2 text-xs focus-visible:ring-2 focus-visible:ring-ring" value={session.mode} disabled={chat.pending || chat.unavailable} onChange={(event) => updateSession(chat.key, { mode: modeSchema.parse(event.target.value), hintLevel: 1 })}>{modeSchema.options.map((mode) => <option key={mode} value={mode}>{labels[mode]}</option>)}</select>
          <DropdownMenu modal={false}><DropdownMenuTrigger asChild><Button type="button" variant="ghost" size="icon" aria-label="Opsi percakapan" disabled={chat.pending}><Ellipsis aria-hidden /></Button></DropdownMenuTrigger><DropdownMenuContent data-cirra-options side="top" align="start" className="max-w-72" onEscapeKeyDown={(event) => event.stopPropagation()}><p className="px-2 py-2 text-xs leading-relaxed text-text-secondary">Konteks terkait digunakan untuk menjawab. Hindari membagikan secret; chat tersimpan selama session ini.</p><DropdownMenuItem disabled={chat.pending} onSelect={chat.clear}><Trash2 aria-hidden />Bersihkan</DropdownMenuItem><DropdownMenuItem disabled={session.hintLevel === 3 || chat.pending} onSelect={() => updateSession(chat.key, { hintLevel: Math.min(3, session.hintLevel + 1) })}>Petunjuk level {session.hintLevel}</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div>
          {chat.pending ? <Button type="button" size="icon" aria-label="Hentikan" title="Hentikan jawaban" onClick={chat.cancel}><Square aria-hidden /></Button> : <Button type="submit" size="icon" disabled={!session.draft.trim()} aria-label="Kirim" title="Kirim pertanyaan"><Send aria-hidden /></Button>}
        </div>
      </div>
      {form.formState.errors.message && <p role="alert" className="mt-1 text-xs text-destructive">{form.formState.errors.message.message}</p>}
    </form>
  </section>;
}
