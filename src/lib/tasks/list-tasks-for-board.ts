import { prisma } from "@/lib/db";
import { buildTaskWhere } from "@/lib/tasks/build-task-where";
import { taskBoardInclude } from "@/lib/tasks/task-board-include";
import type { TaskFilterState } from "@/lib/tasks/task-filters";

export type BoardTask = Awaited<
  ReturnType<typeof listTasksForBoard>
>[number];

export async function listTasksForBoard(
  userId: string,
  projectId: string,
  filters: TaskFilterState,
) {
  const base = buildTaskWhere(projectId, filters);
  return prisma.task.findMany({
    where: {
      AND: [base, { project: { userId } }],
    },
    include: taskBoardInclude,
    orderBy: [{ position: "asc" }],
  });
}
