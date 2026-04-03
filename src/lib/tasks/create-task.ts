import { prisma } from "@/lib/db";
import { ActivityType } from "@/lib/activity/event-types";
import { logActivity } from "@/lib/activity/log-activity";
import { dateFromDateOnlyInput } from "@/lib/tasks/due-date";
import { createTaskSchema } from "@/lib/tasks/schemas";
import type { z } from "zod";

type Input = z.infer<typeof createTaskSchema>;

export async function createTaskForProject(userId: string, input: Input) {
  const project = await prisma.project.findFirst({
    where: { id: input.projectId, userId },
    include: {
      statuses: { orderBy: { sortOrder: "asc" } },
      priorities: { orderBy: { sortOrder: "asc" } },
      labels: { select: { id: true } },
    },
  });
  if (!project) return { ok: false as const, error: "Project not found" };

  const statusId =
    input.statusId && project.statuses.some((s) => s.id === input.statusId)
      ? input.statusId
      : project.statuses[0]?.id;
  const priorityId =
    input.priorityId && project.priorities.some((p) => p.id === input.priorityId)
      ? input.priorityId
      : project.priorities.find((p) => p.name === "Medium")?.id ??
        project.priorities[0]?.id;

  if (!statusId || !priorityId) {
    return { ok: false as const, error: "Missing default status or priority" };
  }

  const allowedLabelIds = new Set(project.labels.map((l) => l.id));
  const labelIds = (input.labelIds ?? []).filter((id) =>
    allowedLabelIds.has(id),
  );

  const dueDate =
    input.dueDate && input.dueDate.length > 0
      ? dateFromDateOnlyInput(input.dueDate)
      : null;

  const maxAgg = await prisma.task.aggregate({
    where: { projectId: project.id, statusId },
    _max: { position: true },
  });
  const position = (maxAgg._max.position ?? -1) + 1;

  const task = await prisma.$transaction(async (tx) => {
    const created = await tx.task.create({
      data: {
        projectId: project.id,
        name: input.name,
        description: input.description?.length ? input.description : null,
        statusId,
        priorityId,
        position,
        dueDate,
      },
    });

    if (labelIds.length) {
      await tx.taskLabel.createMany({
        data: labelIds.map((labelId) => ({
          taskId: created.id,
          labelId,
        })),
        skipDuplicates: true,
      });
    }

    await logActivity(tx, {
      userId,
      taskId: created.id,
      projectId: project.id,
      type: ActivityType.TASK_CREATED,
      metadata: { name: created.name },
    });

    return created;
  });

  return { ok: true as const, task };
}
