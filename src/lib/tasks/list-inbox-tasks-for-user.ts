import { prisma } from "@/lib/db";
import { buildUserTaskWhere } from "@/lib/tasks/build-task-where";
import { taskBoardInclude } from "@/lib/tasks/task-board-include";
import { sortTasksForInbox } from "@/lib/tasks/sort-inbox-tasks";
import type { TaskFilterState } from "@/lib/tasks/task-filters";

/** Pending (non-final) tasks for the user, with inbox ordering and optional URL filters. */
export async function listInboxTasksForUserBoard(
  userId: string,
  filters: TaskFilterState,
) {
  const where = buildUserTaskWhere(userId, filters, {
    inboxPendingOnly: true,
  });
  const rows = await prisma.task.findMany({
    where,
    include: taskBoardInclude,
    orderBy: [{ position: "asc" }],
  });
  return sortTasksForInbox(rows);
}
