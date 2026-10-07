import { serverClient } from "@/lib/supabase/server";
import { errorResponse } from "@/lib/request-security";
export async function GET() {
  try {
    const { data: { user }, error } = await (await serverClient()).auth.getUser();
    if (error && error.status !== 400 && error.status !== 401 && error.status !== 403) return Response.json({ error: "Session belum dapat diverifikasi." }, { status: 503, headers: { "Cache-Control": "private, no-store" } });
    return Response.json({ user: user ? { id: user.id, email: user.email } : null }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return errorResponse(error); }
}
