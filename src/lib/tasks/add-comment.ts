import { prisma } from "@/lib/db";
import { ActivityType } from "@/lib/activity/event-types";
import { logActivity } from "@/lib/activity/log-activity";

export async function addTaskComment(
  userId: string,
  taskId: string,
  body: string,
) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, project: { userId } },
    select: { id: true, projectId: true },
  });
  if (!task) return { ok: false as const, error: "Task not found" };

  const comment = await prisma.comment.create({
    data: { taskId, userId, body },
  });

  await logActivity(prisma, {
    userId,
    taskId,
    projectId: task.projectId,
    type: ActivityType.COMMENT_ADDED,
    metadata: { commentId: comment.id },
  });

  return { ok: true as const, comment };
}
