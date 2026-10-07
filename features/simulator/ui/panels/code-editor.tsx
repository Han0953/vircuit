"use client";
import { useEffect, useState } from "react";
import { useSimulation } from "../../stores/simulation-store";
import Editor, { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor/editor/editor.api";
import "monaco-editor/languages/definitions/cpp/register.js";
import { useTheme } from "next-themes";
import { useProject } from "../../stores/project-store";

globalThis.MonacoEnvironment = { getWorker: () => new Worker(new URL("monaco-editor/editor/editor.worker.js", import.meta.url), { type: "module" }) };
loader.config({ monaco });
if (typeof window !== "undefined") {
  (window as unknown as { monaco: typeof monaco }).monaco = monaco;
}

export default function CodeEditor() {
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
    <Editor
      onMount={(editor) => {
        setModel(editor.getModel());
        if (typeof window !== "undefined") {
          (window as unknown as { __vircuitEditor: monaco.editor.IStandaloneCodeEditor }).__vircuitEditor = editor;
        }
      }}
      height="100%"
      language="cpp"
      path="vircuit://project/sketch.cpp"
      value={source}
      keepCurrentModel
      theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
      loading={<p className="p-4">Memuat editor…</p>}
      options={{ automaticLayout: true, minimap: { enabled: false }, fontSize: 14, scrollBeyondLastLine: false, wordWrap: "on", tabSize: 2, ariaLabel: "Kode Arduino subset" }}
      onChange={(value) => useProject.getState().edit((p) => ({ ...p, code: { ...p.code, source: value ?? "" } }), false)}
    />
  );
}
