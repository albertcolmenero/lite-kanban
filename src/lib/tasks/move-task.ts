import { prisma } from "@/lib/db";
import { ActivityType } from "@/lib/activity/event-types";
import { logActivity } from "@/lib/activity/log-activity";

export async function moveTaskToPosition(
  userId: string,
  taskId: string,
  targetStatusId: string,
  targetIndex: number,
) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, project: { userId } },
    select: { id: true, projectId: true, statusId: true },
  });
  if (!task) return { ok: false as const, error: "Task not found" };

  const oldStatusId = task.statusId;
  const projectId = task.projectId;

  await prisma.$transaction(async (tx) => {
    const targetOthers = await tx.task.findMany({
      where: { projectId, statusId: targetStatusId, id: { not: taskId } },
      orderBy: { position: "asc" },
      select: { id: true },
    });

    const targetIds = targetOthers.map((t) => t.id);
    const clamped = Math.max(0, Math.min(targetIndex, targetIds.length));
    targetIds.splice(clamped, 0, taskId);

    for (let i = 0; i < targetIds.length; i++) {
      await tx.task.update({
        where: { id: targetIds[i] },
        data: { statusId: targetStatusId, position: i },
      });
    }

    if (oldStatusId !== targetStatusId) {
      const oldTasks = await tx.task.findMany({
        where: { projectId, statusId: oldStatusId },
        orderBy: { position: "asc" },
        select: { id: true },
      });
      for (let i = 0; i < oldTasks.length; i++) {
        await tx.task.update({
          where: { id: oldTasks[i].id },
          data: { position: i },
        });
      }
    }

    if (oldStatusId !== targetStatusId) {
      await logActivity(tx, {
        userId,
        taskId,
        projectId,
        type: ActivityType.STATUS_CHANGED,
        metadata: { fromStatusId: oldStatusId, toStatusId: targetStatusId },
      });
    }
  });

  return { ok: true as const };
}
