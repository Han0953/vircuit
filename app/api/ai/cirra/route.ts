import { answerCirra } from "@/features/ai/service";
import { RequestError } from "@/lib/request-security";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  try { return Response.json(await answerCirra(request), { headers: { "Cache-Control": "private, no-store" } }); }
  catch (cause) {
    const status = cause instanceof RequestError ? cause.status : 503;
    const error = status === 401 ? "Masuk dulu untuk bertanya ke Cirra. Project kamu tetap aman." : cause instanceof RequestError ? cause.message : "Aku belum bisa memproses pertanyaan ini. Project kamu tetap aman. Coba lagi sebentar.";
    return Response.json({ error }, { status, headers: { "Cache-Control": "private, no-store" } });
  }
}
