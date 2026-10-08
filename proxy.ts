import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
export async function proxy(request: NextRequest) { return updateSession(request); }
export const config = { matcher: ["/dashboard/:path*", "/simulator/:path*", "/masuk", "/daftar", "/auth/:path*", "/api/projects/:path*", "/api/auth/:path*", "/api/learning/:path*", "/api/challenges/:path*", "/api/progress/:path*", "/api/ai/:path*"] };
