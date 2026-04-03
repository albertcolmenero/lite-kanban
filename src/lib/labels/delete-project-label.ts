import { prisma } from "@/lib/db";

export async function deleteOwnedProjectLabel(userId: string, labelId: string) {
  const row = await prisma.projectLabel.findFirst({
    where: { id: labelId, project: { userId } },
    select: { id: true, projectId: true },
  });
  if (!row) return { ok: false as const, error: "Label not found" };

  await prisma.projectLabel.delete({ where: { id: row.id } });
  return { ok: true as const, projectId: row.projectId };
}
