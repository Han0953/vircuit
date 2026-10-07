import { deleteProject, loadProject, renameProject } from "@/features/projects/server/service";
import { errorResponse } from "@/lib/request-security";
type Context = { params: Promise<{ id: string }> };
const headers = { "Cache-Control": "private, no-store" };
export async function GET(_request: Request, context: Context) { try { return Response.json(await loadProject((await context.params).id), { headers }); } catch (error) { return errorResponse(error); } }
export async function PATCH(request: Request, context: Context) { try { return Response.json(await renameProject(request, (await context.params).id), { headers }); } catch (error) { return errorResponse(error); } }
export async function DELETE(request: Request, context: Context) { try { return Response.json(await deleteProject(request, (await context.params).id), { headers }); } catch (error) { return errorResponse(error); } }
