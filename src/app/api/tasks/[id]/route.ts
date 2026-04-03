import { corsHeadersForRequest, mergeCors } from "@/lib/api/cors";
import { jsonWithCors, requireApiUser } from "@/lib/api/require-api-user";
import { moveTaskToPosition } from "@/lib/tasks/move-task";
import { apiPatchTaskBodySchema, updateTaskSchema } from "@/lib/tasks/schemas";
import { updateOwnedTask } from "@/lib/tasks/update-task";

type RouteContext = { params: Promise<{ id: string }> };

export async function OPTIONS(request: Request) {
  const cors = corsHeadersForRequest(request);
  return new Response(null, {
    status: 204,
    headers: mergeCors(undefined, cors),
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireApiUser(request);
  if ("error" in auth) return auth.error;

  const { id: taskId } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonWithCors({ error: "Invalid JSON" }, { status: 400 }, auth.cors);
  }

  const parsedBody = apiPatchTaskBodySchema.safeParse(body);
  if (!parsedBody.success) {
    return jsonWithCors(
      { error: parsedBody.error.issues[0]?.message ?? "Invalid body" },
      { status: 400 },
      auth.cors,
    );
  }

  const data = parsedBody.data;
  if (data.statusId !== undefined && data.toIndex !== undefined) {
    const result = await moveTaskToPosition(
      auth.userId,
      taskId,
      data.statusId,
      data.toIndex,
    );
    if (!result.ok) {
      return jsonWithCors({ error: result.error }, { status: 400 }, auth.cors);
    }
    return jsonWithCors({ ok: true }, { status: 200 }, auth.cors);
  }

  const updateParsed = updateTaskSchema.safeParse({
    id: taskId,
    name: data.name,
    description: data.description,
    priorityId: data.priorityId,
    labelIds: data.labelIds,
    dueDate: data.dueDate,
  });
  if (!updateParsed.success) {
    return jsonWithCors({ error: "Invalid update" }, { status: 400 }, auth.cors);
  }

  const result = await updateOwnedTask(auth.userId, updateParsed.data);
  if (!result.ok) {
    return jsonWithCors({ error: result.error }, { status: 404 }, auth.cors);
  }

  return jsonWithCors({ ok: true }, { status: 200 }, auth.cors);
}
