import { corsHeadersForRequest, mergeCors } from "@/lib/api/cors";
import { jsonWithCors, requireApiUser } from "@/lib/api/require-api-user";
import { getOwnedProject } from "@/lib/projects/get-project-by-id";
import { createTaskForProject } from "@/lib/tasks/create-task";
import { listTasksForBoard } from "@/lib/tasks/list-tasks-for-board";
import {
  apiCreateTaskBodySchema,
  createTaskSchema,
} from "@/lib/tasks/schemas";
import {
  parseTaskFiltersFromSearchParams,
  recordFromUrlSearchParams,
} from "@/lib/tasks/task-filters";

type RouteContext = { params: Promise<{ id: string }> };

export async function OPTIONS(request: Request) {
  const cors = corsHeadersForRequest(request);
  return new Response(null, {
    status: 204,
    headers: mergeCors(undefined, cors),
  });
}

export async function GET(request: Request, context: RouteContext) {
  const auth = await requireApiUser(request);
  if ("error" in auth) return auth.error;

  const { id: projectId } = await context.params;
  const project = await getOwnedProject(auth.userId, projectId);
  if (!project) {
    return jsonWithCors({ error: "Project not found" }, { status: 404 }, auth.cors);
  }

  const url = new URL(request.url);
  const filters = parseTaskFiltersFromSearchParams(
    recordFromUrlSearchParams(url.searchParams),
  );
  const tasks = await listTasksForBoard(auth.userId, projectId, filters);
  return jsonWithCors({ tasks }, { status: 200 }, auth.cors);
}

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireApiUser(request);
  if ("error" in auth) return auth.error;

  const { id: projectId } = await context.params;
  const project = await getOwnedProject(auth.userId, projectId);
  if (!project) {
    return jsonWithCors({ error: "Project not found" }, { status: 404 }, auth.cors);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonWithCors({ error: "Invalid JSON" }, { status: 400 }, auth.cors);
  }

  const parsedBody = apiCreateTaskBodySchema.safeParse(body);
  if (!parsedBody.success) {
    return jsonWithCors({ error: "Invalid body" }, { status: 400 }, auth.cors);
  }

  const parsed = createTaskSchema.safeParse({
    projectId,
    ...parsedBody.data,
  });
  if (!parsed.success) {
    return jsonWithCors({ error: "Invalid task" }, { status: 400 }, auth.cors);
  }

  const result = await createTaskForProject(auth.userId, parsed.data);
  if (!result.ok) {
    return jsonWithCors({ error: result.error }, { status: 400 }, auth.cors);
  }

  return jsonWithCors({ task: result.task }, { status: 201 }, auth.cors);
}
