import { prisma } from "@/lib/db";
import { ActivityType } from "@/lib/activity/event-types";
import { logActivity } from "@/lib/activity/log-activity";

export async function addSubtask(userId: string, taskId: string, title: string) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, project: { userId } },
    select: { id: true, projectId: true },
  });
  if (!task) return { ok: false as const, error: "Task not found" };

  const max = await prisma.subtask.aggregate({
    where: { taskId },
    _max: { position: true },
  });
  const position = (max._max.position ?? -1) + 1;

  const sub = await prisma.subtask.create({
    data: { taskId, title, position },
  });

  await logActivity(prisma, {
    userId,
    taskId,
    projectId: task.projectId,
    type: ActivityType.SUBTASK_ADDED,
    metadata: { subtaskId: sub.id, title },
  });

  return { ok: true as const, subtask: sub };
}
