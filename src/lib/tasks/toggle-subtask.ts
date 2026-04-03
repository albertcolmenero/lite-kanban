import { prisma } from "@/lib/db";
import { ActivityType } from "@/lib/activity/event-types";
import { logActivity } from "@/lib/activity/log-activity";

export async function toggleSubtask(
  userId: string,
  subtaskId: string,
  completed: boolean,
) {
  const sub = await prisma.subtask.findFirst({
    where: { id: subtaskId, task: { project: { userId } } },
    include: { task: { select: { id: true, projectId: true } } },
  });
  if (!sub) return { ok: false as const, error: "Subtask not found" };

  await prisma.subtask.update({
    where: { id: subtaskId },
    data: { completed },
  });

  await logActivity(prisma, {
    userId,
    taskId: sub.task.id,
    projectId: sub.task.projectId,
    type: ActivityType.SUBTASK_TOGGLED,
    metadata: { subtaskId, completed },
  });

  return { ok: true as const };
}
