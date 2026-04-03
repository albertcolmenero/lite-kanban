import type { Prisma } from "@/generated/prisma/client";
import type { ActivityTypeValue } from "@/lib/activity/event-types";

type ActivityClient = {
  activityEvent: {
    create: (args: {
      data: Prisma.ActivityEventCreateInput;
    }) => Promise<unknown>;
  };
};

export async function logActivity(
  db: ActivityClient,
  input: {
    userId: string;
    taskId: string;
    projectId?: string | null;
    type: ActivityTypeValue;
    metadata?: Prisma.InputJsonValue;
  },
) {
  await db.activityEvent.create({
    data: {
      userId: input.userId,
      task: { connect: { id: input.taskId } },
      projectId: input.projectId ?? undefined,
      type: input.type,
      metadata: input.metadata ?? undefined,
    },
  });
}
