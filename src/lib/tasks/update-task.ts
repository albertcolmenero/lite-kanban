import { prisma } from "@/lib/db";
import { ActivityType } from "@/lib/activity/event-types";
import { logActivity } from "@/lib/activity/log-activity";
import { dateFromDateOnlyInput } from "@/lib/tasks/due-date";
import type { updateTaskSchema } from "@/lib/tasks/schemas";
import type { z } from "zod";

type Input = z.infer<typeof updateTaskSchema>;

export async function updateOwnedTask(userId: string, input: Input) {
  const existing = await prisma.task.findFirst({
    where: { id: input.id, project: { userId } },
    include: { labels: true },
  });
  if (!existing) return { ok: false as const, error: "Task not found" };

  const data: {
    name?: string;
    description?: string | null;
    priorityId?: string;
    dueDate?: Date | null;
  } = {};

  if (input.name !== undefined) data.name = input.name;
  if (input.description !== undefined) {
    data.description = input.description === "" ? null : input.description;
  }
  if (input.dueDate !== undefined) {
    data.dueDate =
      input.dueDate === "" ? null : dateFromDateOnlyInput(input.dueDate);
  }

  const priorityChanged =
    input.priorityId !== undefined &&
    input.priorityId !== existing.priorityId;

  if (priorityChanged) {
    data.priorityId = input.priorityId;
  }

  if (Object.keys(data).length > 0) {
    await prisma.task.update({ where: { id: existing.id }, data });
  }

  const textChanged =
    input.name !== undefined ||
    input.description !== undefined ||
    input.dueDate !== undefined;
  if (textChanged) {
    await logActivity(prisma, {
      userId,
      taskId: existing.id,
      projectId: existing.projectId,
      type: ActivityType.TASK_UPDATED,
      metadata: {
        name: input.name !== undefined,
        description: input.description !== undefined,
        dueDate: input.dueDate !== undefined,
      },
    });
  }

  if (priorityChanged) {
    await logActivity(prisma, {
      userId,
      taskId: existing.id,
      projectId: existing.projectId,
      type: ActivityType.PRIORITY_CHANGED,
      metadata: {
        fromPriorityId: existing.priorityId,
        toPriorityId: input.priorityId,
      },
    });
  }

  if (input.labelIds !== undefined) {
    const current = new Set(existing.labels.map((l) => l.labelId));
    const next = new Set(input.labelIds);
    const toRemove = [...current].filter((id) => !next.has(id));
    const toAdd = [...next].filter((id) => !current.has(id));
    if (toRemove.length || toAdd.length) {
      await prisma.$transaction(async (tx) => {
        if (toRemove.length) {
          await tx.taskLabel.deleteMany({
            where: { taskId: existing.id, labelId: { in: toRemove } },
          });
        }
        if (toAdd.length) {
          await tx.taskLabel.createMany({
            data: toAdd.map((labelId) => ({ taskId: existing.id, labelId })),
            skipDuplicates: true,
          });
        }
        await logActivity(tx, {
          userId,
          taskId: existing.id,
          projectId: existing.projectId,
          type: ActivityType.LABELS_CHANGED,
          metadata: { labelIds: input.labelIds },
        });
      });
    }
  }

  return { ok: true as const };
}
