import { listProjectPage, listProjects, saveProject } from "@/features/projects/server/service";
import { errorResponse } from "@/lib/request-security";
const headers = { "Cache-Control": "private, no-store" };
export async function GET(request: Request) {
  try {
    const query = new URL(request.url).searchParams;
    const data = query.has("page") || query.has("search")
      ? await listProjectPage({ page: query.get("page") ?? 1, search: query.get("search") ?? "" })
      : await listProjects();
    return Response.json(data, { headers });
  } catch (error) { return errorResponse(error); }
}
export async function POST(request: Request) { try { return Response.json(await saveProject(request), { headers }); } catch (error) { return errorResponse(error); } }
