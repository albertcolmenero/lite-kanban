import { prisma } from "@/lib/db";

export async function getOwnedProject(userId: string, projectId: string) {
  return prisma.project.findFirst({
    where: { id: projectId, userId },
    include: {
      statuses: { orderBy: { sortOrder: "asc" } },
      priorities: { orderBy: { sortOrder: "asc" } },
      labels: { orderBy: { name: "asc" } },
    },
  });
}
