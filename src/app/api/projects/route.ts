import { corsHeadersForRequest, mergeCors } from "@/lib/api/cors";
import { jsonWithCors, requireApiUser } from "@/lib/api/require-api-user";
import { listProjectsWithStatusBreakdown } from "@/lib/projects/list-projects-with-status-breakdown";

export async function OPTIONS(request: Request) {
  const cors = corsHeadersForRequest(request);
  return new Response(null, {
    status: 204,
    headers: mergeCors(undefined, cors),
  });
}

export async function GET(request: Request) {
  const auth = await requireApiUser(request);
  if ("error" in auth) return auth.error;

  const rows = await listProjectsWithStatusBreakdown(auth.userId);
  return jsonWithCors({ projects: rows }, { status: 200 }, auth.cors);
}
