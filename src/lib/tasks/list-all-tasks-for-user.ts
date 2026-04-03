import { prisma } from "@/lib/db";
import { taskBoardInclude } from "@/lib/tasks/task-board-include";

export type UserBoardTask = Awaited<
  ReturnType<typeof listAllTasksForUserBoard>
>[number];

export async function listAllTasksForUserBoard(userId: string) {
  return prisma.task.findMany({
    where: { project: { userId } },
    include: taskBoardInclude,
    orderBy: [{ position: "asc" }],
  });
}
