"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import {
  createOwnedProjectStatus,
  deleteOwnedProjectStatus,
  moveOwnedProjectStatus,
  updateOwnedProjectStatus,
} from "@/lib/projects/manage-project-status";
import {
  createProjectStatusSchema,
  moveProjectStatusSchema,
  updateProjectStatusSchema,
} from "@/lib/projects/status-schemas";

export type StatusActionState = { error?: string; ok?: boolean };

function path(projectId: string) {
  return `/projects/${projectId}`;
}

export async function createProjectStatusAction(
  _p: unknown,
  formData: FormData,
): Promise<StatusActionState> {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };

  const parsed = createProjectStatusSchema.safeParse({
    projectId: formData.get("projectId"),
    name: formData.get("name"),
  });
  if (!parsed.success) return { error: "Invalid name" };

  const result = await createOwnedProjectStatus(
    userId,
    parsed.data.projectId,
    parsed.data.name,
  );
  if (!result.ok) return { error: result.error };

  revalidatePath(path(parsed.data.projectId));
  return { ok: true };
}

export async function updateProjectStatusAction(
  _p: unknown,
  formData: FormData,
): Promise<StatusActionState> {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };

  const parsed = updateProjectStatusSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    isFinal: formData.get("isFinal") === "on",
  });
  if (!parsed.success) return { error: "Invalid input" };

  const result = await updateOwnedProjectStatus(
    userId,
    parsed.data.id,
    parsed.data.name,
    parsed.data.isFinal,
  );
  if (!result.ok) return { error: result.error };

  revalidatePath(path(result.projectId));
  return { ok: true };
}

export async function deleteProjectStatusAction(
  statusId: string,
  projectId: string,
): Promise<StatusActionState> {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };

  const result = await deleteOwnedProjectStatus(userId, statusId);
  if (!result.ok) return { error: result.error };

  revalidatePath(path(projectId));
  return { ok: true };
}

export async function moveProjectStatusAction(
  _p: unknown,
  formData: FormData,
): Promise<StatusActionState> {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };

  const parsed = moveProjectStatusSchema.safeParse({
    id: formData.get("id"),
    direction: formData.get("direction"),
  });
  if (!parsed.success) return { error: "Invalid input" };

  const result = await moveOwnedProjectStatus(
    userId,
    parsed.data.id,
    parsed.data.direction,
  );
  if (!result.ok) return { error: result.error };

  revalidatePath(path(result.projectId));
  return { ok: true };
}
