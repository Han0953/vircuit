import { evaluationSchema, type Evaluation, type Submission } from "./contracts";
export function previewSubmission(input: Submission): Promise<Evaluation> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
    const timer = setTimeout(() => { worker.terminate(); reject(new Error("Evaluasi melewati batas waktu.")); }, 5000);
    const close = () => { clearTimeout(timer); worker.terminate(); };
    worker.onerror = () => { close(); reject(new Error("Evaluator belum dapat dijalankan.")); };
    worker.onmessage = ({ data }: MessageEvent<{ result?: Evaluation; error?: string }>) => {
      close();
      const parsed = evaluationSchema.safeParse(data.result);
      if (parsed.success) resolve(parsed.data); else reject(new Error(data.error ?? "Evaluasi gagal."));
    };
    worker.postMessage(input);
  });
}
