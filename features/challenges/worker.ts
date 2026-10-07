import { evaluateSubmission, EvaluationLimitError } from "./evaluate";
import type { Submission } from "./contracts";
self.onmessage = async ({ data }: MessageEvent<Submission>) => {
  try { self.postMessage({ result: await evaluateSubmission(data) }); }
  catch (cause) { self.postMessage({ error: cause instanceof EvaluationLimitError ? cause.message : "Evaluasi belum dapat dijalankan. Periksa project dan versi tantangan." }); }
};
