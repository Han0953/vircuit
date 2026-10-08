"use client";
import { useEffect, useId, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Send, Square, RotateCcw, Trash2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { modeSchema, type CirraMode, type CirraRequest } from "../contracts";
import { useChat } from "./use-chat";
import { ProjectBlueprint } from "./project-blueprint";
const formSchema = z.object({ message: z.string().trim().min(1, "Tulis pertanyaan dulu.").max(2000, "Maksimal 2000 karakter.") });
const labels: Record<CirraMode, string> = { tutor: "Tutor", debugger: "Debugger", "project-assistant": "Project Assistant" };
export function CirraChat({ owner, scope, contextLabel, initialMode = "tutor", getContext }: { owner: string; scope: string; contextLabel: string; initialMode?: CirraMode; getContext: () => Partial<CirraRequest> }) {
  const id = useId();
  const [mode, setMode] = useState(initialMode); const [hintLevel, setHintLevel] = useState(1);
  const chat = useChat(owner, scope, mode, getContext);
  const log = useRef<HTMLDivElement>(null);
  useEffect(() => { if (log.current) log.current.scrollTop = log.current.scrollHeight; }, [chat.messages.length]);
  const form = useForm<z.infer<typeof formSchema>>({ resolver: zodResolver(formSchema), defaultValues: { message: "" } });
  return <section aria-label="Percakapan Cirra" className="cirra-chat flex h-full min-h-0 min-w-0 flex-col bg-background">
    <div className="cirra-layout flex h-full min-h-0 flex-col">
    <header className="shrink-0 border-b p-3"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="flex items-center gap-2 text-sm font-semibold"><Sparkles aria-hidden className="size-4 text-ai" />Cirra</h2><p title={contextLabel} className="max-w-40 truncate text-xs text-text-secondary">Konteks: {contextLabel}</p><label className="flex items-center gap-2 text-xs" htmlFor={`${id}-mode`}>Mode<select aria-label="Mode" id={`${id}-mode`} className="min-h-11 max-w-44 rounded border bg-surface px-2 focus-visible:ring-2 focus-visible:ring-ring" value={mode} disabled={chat.pending} onChange={(event) => { setMode(modeSchema.parse(event.target.value)); setHintLevel(1); }}>{modeSchema.options.map((value) => <option key={value} value={value}>{labels[value]}</option>)}</select></label></div></header>
    <div ref={log} aria-label="Riwayat percakapan" role="log" aria-live="off" aria-busy={chat.pending} className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-3">
      {!chat.messages.length && <div className="max-w-[70ch] text-sm leading-relaxed"><p>Aku Cirra, AI pendamping belajar Vircuit. Kamu bisa bertanya konsep, memeriksa rangkaian, atau merencanakan project.</p><p className="mt-2 text-text-secondary">Hasil evaluator tetap menentukan tantangan. Aku bantu menjelaskan dan memberi petunjuk.</p></div>}
      {chat.messages.map((message) => <article key={message.id} className="min-w-0 space-y-3 rounded-md border bg-surface p-3 text-sm leading-relaxed"><p className="text-xs font-semibold text-text-secondary">{message.role === "user" ? "Kamu" : "Cirra"}</p><p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{message.text}</p>{message.reply && <><ul className="list-disc space-y-1 pl-5">{[...message.reply.result.observations, ...message.reply.result.suggestions, ...message.reply.result.hints].map((text, index) => <li key={index} className="break-words [overflow-wrap:anywhere]">{text}</li>)}</ul>{message.reply.result.blueprint && <ProjectBlueprint plan={message.reply.result.blueprint} />}{message.reply.result.references.length > 0 && <p className="break-words text-xs text-text-secondary">Referensi: {message.reply.result.references.join(", ")}</p>}<details className="text-xs"><summary className="min-h-11 cursor-pointer py-3 focus-visible:ring-2 focus-visible:ring-ring">Konteks jawaban</summary><p className="break-words">{message.reply.context.sources.join(" · ")}</p>{message.reply.context.truncated.length > 0 && <p>Dibatasi: {message.reply.context.truncated.join(", ")}</p>}</details></>}</article>)}
    </div>
    <div role="status" aria-live="polite" className="shrink-0 px-3 text-xs">{chat.pending ? "Cirra sedang menyiapkan jawaban…" : chat.messages.at(-1)?.role === "assistant" ? "Jawaban Cirra tersedia." : ""}</div>
    {chat.error && <div role="alert" className="shrink-0 px-3 py-2 text-sm"><p>{chat.error}</p>{chat.lastQuestion && <Button disabled={chat.pending} variant="outline" onClick={() => void chat.send(chat.lastQuestion, hintLevel)}><RotateCcw aria-hidden />Coba lagi</Button>}</div>}
    <form className="cirra-composer flex shrink-0 flex-col gap-2 border-t bg-surface p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]" onSubmit={form.handleSubmit((values) => { void chat.send(values.message, hintLevel); form.reset(); })}>
      <div className="cirra-composer-label flex flex-wrap justify-between gap-2"><label htmlFor={`${id}-message`} className="text-xs font-medium">Pertanyaan untuk Cirra</label><p className="text-xs text-text-secondary">Konteks terbaru dikirim ke Gemini. Hindari secret. Chat hanya selama session.</p></div><textarea id={`${id}-message`} disabled={chat.pending} rows={2} maxLength={2000} className="block max-h-32 min-h-16 w-full resize-y rounded-md border bg-background p-2 text-sm focus-visible:ring-2 focus-visible:ring-ring" {...form.register("message")} />{form.formState.errors.message && <p role="alert" className="cirra-composer-error text-xs">{form.formState.errors.message.message}</p>}
      <div className="cirra-composer-controls flex flex-wrap items-center gap-2"><Button type="submit" disabled={chat.pending}><Send aria-hidden />Kirim</Button>{chat.pending && <Button type="button" variant="outline" onClick={chat.cancel}><Square aria-hidden />Batalkan</Button>}<Button type="button" variant="ghost" disabled={chat.pending} onClick={chat.clear}><Trash2 aria-hidden />Bersihkan</Button><Button type="button" variant="ghost" disabled={hintLevel === 3 || chat.pending} onClick={() => setHintLevel((level) => Math.min(3, level + 1))}>Petunjuk level {hintLevel}</Button></div>
    </form>
    </div>
  </section>;
}
