import type { CirraRequest } from "./contracts";
export function modelCategory(input: CirraRequest, hasFailures: boolean, override?: "FAST" | "SMART"): "FAST" | "SMART" {
  if (override) return override;
  if (input.mode !== "tutor" || hasFailures || input.message.length > 600 || /analisis|bandingkan|mengapa.*(?:kode|rangkaian)|hubungan.*(?:wiring|kode)|langkah.*project/i.test(input.message)) return "SMART";
  return "FAST";
}
