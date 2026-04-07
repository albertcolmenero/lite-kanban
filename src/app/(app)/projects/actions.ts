"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createProjectWithDefaults } from "@/lib/projects/create-project";
import { deleteOwnedProject } from "@/lib/projects/delete-project";
import { createProjectSchema, updateProjectSchema } from "@/lib/projects/schemas";
import { updateOwnedProject } from "@/lib/projects/update-project";

export type ActionState = { error?: string; ok?: boolean };

export async function createProjectAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };

  const parsed = createProjectSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) {
    return {
      error:
        parsed.error.flatten().fieldErrors.name?.[0] ??
        parsed.error.flatten().formErrors[0] ??
        "Invalid input",
    };
  }

  try {
    await createProjectWithDefaults(userId, parsed.data);
  } catch {
    return { error: "Could not create project" };
  }

  revalidatePath("/projects");
  return { ok: true };
}

export async function updateProjectAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };

  const parsed = updateProjectSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name") || undefined,
    description: formData.has("description")
      ? String(formData.get("description"))
      : undefined,
    color: formData.has("color") ? String(formData.get("color")) : undefined,
  });
  if (!parsed.success) {
    return { error: "Invalid input" };
  }

  const result = await updateOwnedProject(userId, parsed.data);
  if (!result.ok) return { error: result.error };

  revalidatePath("/projects");
  revalidatePath(`/projects/${parsed.data.id}`);
  return { ok: true };
}

export async function deleteProjectAction(projectId: string): Promise<ActionState> {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };

  const deleted = await deleteOwnedProject(userId, projectId);
  if (!deleted) return { error: "Project not found" };

  revalidatePath("/projects");
  return { ok: true };
}
