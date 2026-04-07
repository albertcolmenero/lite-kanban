import { prisma } from "@/lib/db";
import type { BuildTaskWhereOptions } from "@/lib/tasks/build-task-where";
import { buildTaskWhere } from "@/lib/tasks/build-task-where";
import { taskBoardInclude } from "@/lib/tasks/task-board-include";
import { sortTasksForInbox } from "@/lib/tasks/sort-inbox-tasks";
import type { TaskFilterState } from "@/lib/tasks/task-filters";

export type BoardTask = Awaited<
  ReturnType<typeof listTasksForBoard>
>[number];

export async function listTasksForBoard(
  userId: string,
  projectId: string,
  filters: TaskFilterState,
  options?: BuildTaskWhereOptions,
) {
  const base = buildTaskWhere(projectId, filters, options);
  const rows = await prisma.task.findMany({
    where: {
      AND: [base, { project: { userId } }],
    },
    include: taskBoardInclude,
    orderBy: [{ position: "asc" }],
  });
  if (options?.inboxPendingOnly) {
    return sortTasksForInbox(rows);
  }
  return rows;
}
