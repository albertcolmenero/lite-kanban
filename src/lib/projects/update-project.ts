import { prisma } from "@/lib/db";
import type { UpdateProjectInput } from "@/lib/projects/schemas";

export async function updateOwnedProject(userId: string, input: UpdateProjectInput) {
  const existing = await prisma.project.findFirst({
    where: { id: input.id, userId },
  });
  if (!existing) {
    return { ok: false as const, error: "Project not found" };
  }

  const data: { name?: string; description?: string | null } = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.description !== undefined) {
    data.description = input.description === "" ? null : input.description;
  }

  if (Object.keys(data).length === 0) {
    return { ok: true as const, project: existing };
  }

  const project = await prisma.project.update({
    where: { id: input.id },
    data,
  });
  return { ok: true as const, project };
}
