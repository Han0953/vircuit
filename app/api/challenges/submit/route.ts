import { submitChallenge } from "@/features/challenges/server";
import { errorResponse } from "@/lib/request-security";
export async function POST(request: Request) {
  try { return Response.json(await submitChallenge(request), { headers: { "Cache-Control": "private, no-store" } }); }
  catch (error) { return errorResponse(error); }
}
