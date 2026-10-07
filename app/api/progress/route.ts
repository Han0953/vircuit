import { readProgress, recordLearningEvent } from "@/features/progress/server";
import { errorResponse } from "@/lib/request-security";
export async function GET() {
  try { return Response.json(await readProgress(), { headers: { "Cache-Control": "private, no-store" } }); }
  catch (error) { return errorResponse(error); }
}
export async function POST(request: Request) {
  try { return Response.json(await recordLearningEvent(request), { headers: { "Cache-Control": "private, no-store" } }); }
  catch (error) { return errorResponse(error); }
}
