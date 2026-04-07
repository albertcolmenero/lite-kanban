"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";
import { ActivityType } from "@/lib/activity/event-types";
import { logActivity } from "@/lib/activity/log-activity";
import { LABEL_COLOR_OPTIONS } from "@/lib/board/constants";
import { prisma } from "@/lib/db";
import { createProjectLabel } from "@/lib/labels/create-project-label";
import { deleteOwnedProjectLabel } from "@/lib/labels/delete-project-label";
import { updateOwnedProjectLabel } from "@/lib/labels/update-project-label";
import { addTaskComment } from "@/lib/tasks/add-comment";
import { addSubtask } from "@/lib/tasks/add-subtask";
import { createTaskForProject } from "@/lib/tasks/create-task";
import { deleteOwnedTask } from "@/lib/tasks/delete-task";
import { moveTaskToPosition } from "@/lib/tasks/move-task";
import {
  commentSchema,
  createLabelSchema,
  createTaskSchema,
  updateLabelSchema,
  subtaskSchema,
  updateTaskSchema,
} from "@/lib/tasks/schemas";
import { toggleSubtask } from "@/lib/tasks/toggle-subtask";
import { updateOwnedTask } from "@/lib/tasks/update-task";

export type BoardActionState = { error?: string; ok?: boolean };

function path(projectId: string) {
  return `/projects/${projectId}`;
}

export async function moveTaskAction(
  projectId: string,
  taskId: string,
  toStatusId: string,
  toIndex: number,
) {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };

  const result = await moveTaskToPosition(userId, taskId, toStatusId, toIndex);
  if (!result.ok) return { error: result.error };

  revalidatePath(path(projectId));
  return { ok: true };
}

export async function createTaskBoardAction(
  _p: unknown,
  formData: FormData,
) {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };

  let createLabelIds: string[] | undefined;
  if (formData.has("labelIds")) {
    const labelRaw = formData.get("labelIds");
    createLabelIds =
      typeof labelRaw === "string"
        ? labelRaw.split(",").filter(Boolean)
        : [];
  }

  const dueRaw = formData.get("dueDate");
  const dueDate = typeof dueRaw === "string" ? dueRaw : undefined;

  const parsed = createTaskSchema.safeParse({
    projectId: formData.get("projectId"),
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    statusId: formData.get("statusId") || undefined,
    priorityId: formData.get("priorityId") || undefined,
    dueDate,
    labelIds: createLabelIds,
  });
  if (!parsed.success) return { error: "Invalid task" };

  const result = await createTaskForProject(userId, parsed.data);
  if (!result.ok) return { error: result.error };

  revalidatePath(path(parsed.data.projectId));
  return { ok: true };
}

export async function updateTaskBoardAction(
  _p: unknown,
  formData: FormData,
) {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };

  let labelIds: string[] | undefined;
  if (formData.has("labelIds")) {
    const labelRaw = formData.get("labelIds");
    labelIds =
      typeof labelRaw === "string"
        ? labelRaw.split(",").filter(Boolean)
        : [];
  }

  const dueRaw = formData.get("dueDate");
  const dueDate =
    formData.has("dueDate") && typeof dueRaw === "string"
      ? dueRaw
      : undefined;

  const parsed = updateTaskSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name") || undefined,
    description: formData.has("description")
      ? String(formData.get("description"))
      : undefined,
    statusId: formData.get("statusId") || undefined,
    priorityId: formData.get("priorityId") || undefined,
    labelIds,
    dueDate,
  });
  if (!parsed.success) return { error: "Invalid input" };

  const result = await updateOwnedTask(userId, parsed.data);
  if (!result.ok) return { error: result.error };

  const projectId = formData.get("projectId");
  if (typeof projectId === "string") revalidatePath(path(projectId));
  return { ok: true };
}

export async function deleteTaskBoardAction(projectId: string, taskId: string) {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };

  const ok = await deleteOwnedTask(userId, taskId);
  if (!ok) return { error: "Task not found" };

  revalidatePath(path(projectId));
  return { ok: true };
}

export async function addCommentAction(_p: unknown, formData: FormData) {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };

  const parsed = commentSchema.safeParse({
    taskId: formData.get("taskId"),
    body: formData.get("body"),
  });
  if (!parsed.success) return { error: "Invalid comment" };

  const result = await addTaskComment(
    userId,
    parsed.data.taskId,
    parsed.data.body,
  );
  if (!result.ok) return { error: result.error };

  const projectId = formData.get("projectId");
  if (typeof projectId === "string") revalidatePath(path(projectId));
  return { ok: true };
}

export async function addSubtaskAction(_p: unknown, formData: FormData) {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };

  const parsed = subtaskSchema.safeParse({
    taskId: formData.get("taskId"),
    title: formData.get("title"),
  });
  if (!parsed.success) return { error: "Invalid subtask" };

  const result = await addSubtask(
    userId,
    parsed.data.taskId,
    parsed.data.title,
  );
  if (!result.ok) return { error: result.error };

  const projectId = formData.get("projectId");
  if (typeof projectId === "string") revalidatePath(path(projectId));
  return { ok: true };
}

export async function toggleSubtaskAction(
  subtaskId: string,
  completed: boolean,
  projectId: string,
) {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };

  const result = await toggleSubtask(userId, subtaskId, completed);
  if (!result.ok) return { error: result.error };

  revalidatePath(path(projectId));
  return { ok: true };
}

export async function createLabelBoardAction(
  _p: unknown,
  formData: FormData,
) {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };

  const parsed = createLabelSchema.safeParse({
    projectId: formData.get("projectId"),
    name: formData.get("name"),
    color: formData.get("color"),
  });
  if (!parsed.success) return { error: "Invalid label" };

  const result = await createProjectLabel(
    userId,
    parsed.data.projectId,
    parsed.data.name,
    parsed.data.color,
  );
  if (!result.ok) return { error: result.error };

  revalidatePath(path(parsed.data.projectId));
  return { ok: true };
}

const DEFAULT_INLINE_LABEL_COLOR =
  LABEL_COLOR_OPTIONS[0]?.value ?? "#64748b";

export type CreateLabelInlineResult =
  | { ok: true; label: { id: string; name: string; color: string } }
  | { ok: false; error: string };

/** Programmatic create (e.g. multiselect “create row”); returns the new label for optimistic UI. */
export async function createLabelInlineAction(
  projectId: string,
  name: string,
): Promise<CreateLabelInlineResult> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Unauthorized" };

  const parsed = createLabelSchema.safeParse({
    projectId,
    name,
    color: DEFAULT_INLINE_LABEL_COLOR,
  });
  if (!parsed.success) return { ok: false, error: "Invalid label name" };

  const result = await createProjectLabel(
    userId,
    parsed.data.projectId,
    parsed.data.name,
    parsed.data.color,
  );
  if (!result.ok) return { ok: false, error: result.error };

  revalidatePath(path(parsed.data.projectId));
  const label = result.label;
  return {
    ok: true,
    label: { id: label.id, name: label.name, color: label.color },
  };
}

export async function updateLabelBoardAction(
  _p: unknown,
  formData: FormData,
) {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };

  const parsed = updateLabelSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    color: formData.get("color"),
  });
  if (!parsed.success) return { error: "Invalid label" };

  const result = await updateOwnedProjectLabel(
    userId,
    parsed.data.id,
    parsed.data.name,
    parsed.data.color,
  );
  if (!result.ok) return { error: result.error };

  revalidatePath(path(result.projectId));
  return { ok: true };
}

export async function deleteLabelBoardAction(
  labelId: string,
  projectId: string,
): Promise<BoardActionState> {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };

  const result = await deleteOwnedProjectLabel(userId, labelId);
  if (!result.ok) return { error: result.error };

  revalidatePath(path(projectId));
  return { ok: true };
}

export async function uploadTaskAttachmentAction(formData: FormData): Promise<void> {
  const { userId } = await auth();
  if (!userId) return;

  const taskId = formData.get("taskId");
  const projectId = formData.get("projectId");
  const file = formData.get("file");

  if (typeof taskId !== "string" || typeof projectId !== "string") {
    return;
  }
  if (!(file instanceof File) || file.size === 0) {
    return;
  }

  const task = await prisma.task.findFirst({
    where: { id: taskId, project: { userId } },
    select: { id: true, projectId: true },
  });
  if (!task) return;

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return;

  const safeName = file.name.replace(/[^\w.\-]+/g, "_").slice(0, 180);
  const key = `tasks/${taskId}/${Date.now()}-${safeName}`;

  const blob = await put(key, file, {
    access: "public",
    token,
  });

  await prisma.attachment.create({
    data: {
      taskId,
      url: blob.url,
      filename: file.name,
      contentType: file.type || null,
      size: file.size,
    },
  });

  await logActivity(prisma, {
    userId,
    taskId,
    projectId: task.projectId,
    type: ActivityType.ATTACHMENT_ADDED,
    metadata: { url: blob.url, filename: file.name },
  });

  revalidatePath(path(projectId));
}
