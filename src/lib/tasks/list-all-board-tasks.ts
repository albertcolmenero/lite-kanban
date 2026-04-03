import { prisma } from "@/lib/db";
import { taskBoardInclude } from "@/lib/tasks/task-board-include";

/** All tasks in a project (no URL filters) for search autocomplete and opening detail when filtered off the board. */
export async function listAllBoardTasksForProject(userId: string, projectId: string) {
  return prisma.task.findMany({
    where: {
      projectId,
      project: { userId },
    },
    include: taskBoardInclude,
    orderBy: [{ position: "asc" }],
  });
}
