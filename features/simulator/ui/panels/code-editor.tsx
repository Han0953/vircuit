"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Clipboard, Copy, Scissors, TextSelect } from "lucide-react";
import { useSimulation } from "../../stores/simulation-store";
import Editor, { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor/editor/editor.api";
import "monaco-editor/languages/definitions/cpp/register.js";
import { useTheme } from "next-themes";
import { useProject } from "../../stores/project-store";
import { usePersistence } from "@/features/projects/store";

globalThis.MonacoEnvironment = { getWorker: () => new Worker(new URL("monaco-editor/editor/editor.worker.js", import.meta.url), { type: "module" }) };
loader.config({ monaco });
if (typeof window !== "undefined") {
  (window as unknown as { monaco: typeof monaco }).monaco = monaco;
}

export default function CodeEditor({ active = true }: { active?: boolean }) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [clipboardMessage, setClipboardMessage] = useState("");
  const [copyFallback, setCopyFallback] = useState<string | null>(null);
  useEffect(() => {
    if (!active) return;
    let frame = 0;
    const resize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const editor = editorRef.current;
        editor?.layout();
        const position = editor?.getPosition();
        if (position) editor?.revealPositionInCenterIfOutsideViewport(position);
      });
    };
    window.visualViewport?.addEventListener("resize", resize);
    resize();
    return () => { cancelAnimationFrame(frame); window.visualViewport?.removeEventListener("resize", resize); };
  }, [active]);
  async function clipboard(action: "copy" | "all" | "cut" | "paste") {
    const editor = editorRef.current, model = editor?.getModel(), selection = editor?.getSelection();
    if (!editor || !model || !selection) return;
    setClipboardMessage("");
    const text = action === "all" ? model.getValue() : model.getValueInRange(selection);
    try {
      if (action === "paste") {
        const value = await navigator.clipboard.readText();
        if (editor.getModel() !== model || model.isDisposed()) return;
        editor.pushUndoStop(); editor.executeEdits("clipboard", [{ range: editor.getSelection() ?? selection, text: value }]); editor.pushUndoStop();
      } else {
        if (!text) { setClipboardMessage("Pilih teks kode terlebih dahulu."); return; }
        await navigator.clipboard.writeText(text);
        if (action === "cut" && editor.getModel() === model && !model.isDisposed() && model.getValueInRange(selection) === text) {
          editor.pushUndoStop(); editor.executeEdits("clipboard", [{ range: selection, text: "" }]); editor.pushUndoStop();
        }
      }
      setClipboardMessage(action === "paste" ? "Kode ditempel." : action === "cut" ? "Pilihan dipotong." : "Kode disalin.");
    } catch {
      if (action !== "paste" && text) setCopyFallback(text);
      else setClipboardMessage("Izin clipboard belum tersedia. Gunakan menu tempel perangkat atau Ctrl/Cmd+V.");
    }
  }
  const draftId = usePersistence((s) => s.draft?.id ?? "recovering");
  const problems = useSimulation((s) => s.problems);
  const [model, setModel] = useState<monaco.editor.ITextModel | null>(null);
  useEffect(() => {
    if (model && !model.isDisposed()) {
      monaco.editor.setModelMarkers(model, "vircuit", problems.filter((p) => p.line).map((p) => ({
        severity: p.severity === "error" ? monaco.MarkerSeverity.Error : monaco.MarkerSeverity.Warning,
        message: p.message,
        startLineNumber: p.line!,
        endLineNumber: p.line!,
        startColumn: 1,
        endColumn: 1000
      })));
    }
  }, [model, problems]);
  const source = useProject((s) => s.project.code.source);
  const { resolvedTheme } = useTheme();
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b px-3 py-1 lg:hidden">
        <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" aria-label="Aksi teks kode"><Clipboard aria-hidden />Teks kode</Button></DropdownMenuTrigger><DropdownMenuContent align="start">
          <DropdownMenuItem onSelect={() => { const editor = editorRef.current, model = editor?.getModel(); if (model) { editor?.setSelection(model.getFullModelRange()); editor?.focus(); } }}><TextSelect aria-hidden />Pilih semua</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setCopyFallback(editorRef.current?.getValue() ?? "")}><TextSelect aria-hidden />Seleksi sentuh</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => void clipboard("copy")}><Copy aria-hidden />Salin pilihan</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => void clipboard("all")}><Copy aria-hidden />Salin semua</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => void clipboard("cut")}><Scissors aria-hidden />Potong pilihan</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => void clipboard("paste")}><Clipboard aria-hidden />Tempel</DropdownMenuItem>
        </DropdownMenuContent></DropdownMenu>
        <span role="status" className="text-xs text-text-secondary">{clipboardMessage}</span>
      </div>
      <div className="min-h-0 flex-1"><Editor
      onMount={(editor) => {
        editorRef.current = editor;
        setModel(editor.getModel());
        if (typeof window !== "undefined") {
          (window as unknown as { __vircuitEditor: monaco.editor.IStandaloneCodeEditor }).__vircuitEditor = editor;
        }
      }}
      height="100%"
      language="cpp"
      key={draftId}
      path={`vircuit://${draftId}/sketch.cpp`}
      value={source}
      theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
      loading={<p className="p-4">Memuat editor…</p>}
      options={{ automaticLayout: active, contextmenu: true, minimap: { enabled: false }, fontSize: 14, scrollBeyondLastLine: false, wordWrap: "on", tabSize: 2, ariaLabel: "Kode Arduino subset" }}
      onChange={(value) => useProject.getState().edit((p) => ({ ...p, code: { ...p.code, source: value ?? "" } }), false)}
    /></div>
    <Dialog open={copyFallback !== null} onOpenChange={(open) => { if (!open) setCopyFallback(null); }}><DialogContent><DialogHeader><DialogTitle>Salin kode</DialogTitle><DialogDescription>Tahan teks untuk memilihnya, lalu gunakan Salin dari menu perangkat. Kode aktif tetap dipertahankan.</DialogDescription></DialogHeader><textarea aria-label="Kode untuk disalin" readOnly value={copyFallback ?? ""} onFocus={(event) => event.currentTarget.select()} className="h-56 w-full select-text overflow-auto rounded border p-3 font-mono text-base" /></DialogContent></Dialog>
    </div>
  );
}
