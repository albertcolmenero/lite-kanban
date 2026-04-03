import { prisma } from "@/lib/db";

export async function deleteOwnedTask(userId: string, taskId: string) {
  const result = await prisma.task.deleteMany({
    where: { id: taskId, project: { userId } },
  });
  return result.count === 1;
}
