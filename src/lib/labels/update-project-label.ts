import { prisma } from "@/lib/db";

export async function updateOwnedProjectLabel(
  userId: string,
  labelId: string,
  name: string,
  color: string,
) {
  const row = await prisma.projectLabel.findFirst({
    where: { id: labelId, project: { userId } },
    select: { id: true, projectId: true },
  });
  if (!row) return { ok: false as const, error: "Label not found" };

  try {
    await prisma.projectLabel.update({
      where: { id: row.id },
      data: { name, color },
    });
  } catch {
    return {
      ok: false as const,
      error: "Could not save (duplicate name in this project?)",
    };
  }

  return { ok: true as const, projectId: row.projectId };
}
