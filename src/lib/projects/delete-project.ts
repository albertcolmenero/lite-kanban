import { prisma } from "@/lib/db";

export async function deleteOwnedProject(userId: string, projectId: string) {
  const result = await prisma.project.deleteMany({
    where: { id: projectId, userId },
  });
  return result.count === 1;
}
