import { prisma } from "@/lib/db";

export async function getOwnedTaskFull(userId: string, taskId: string) {
  return prisma.task.findFirst({
    where: { id: taskId, project: { userId } },
    include: {
      status: true,
      priority: true,
      labels: { include: { label: true } },
      subtasks: { orderBy: { position: "asc" } },
      attachments: true,
      comments: { orderBy: { createdAt: "desc" } },
      activities: { orderBy: { createdAt: "desc" }, take: 80 },
      project: {
        include: {
          labels: { orderBy: { name: "asc" } },
          statuses: { orderBy: { sortOrder: "asc" } },
          priorities: { orderBy: { sortOrder: "asc" } },
        },
      },
    },
  });
}
