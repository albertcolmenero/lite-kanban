import type { Prisma } from "@/generated/prisma/client";
import type { TaskFilterState } from "@/lib/tasks/task-filters";

export type BuildTaskWhereOptions = {
  /** Restrict to tasks whose status is not marked final (pending / inbox). */
  inboxPendingOnly?: boolean;
};

function collectFilterParts(
  filters: TaskFilterState,
  options?: BuildTaskWhereOptions,
): Prisma.TaskWhereInput[] {
  const parts: Prisma.TaskWhereInput[] = [];

  if (options?.inboxPendingOnly) {
    parts.push({ status: { isFinal: false } });
  }

  if (filters.search?.length) {
    const s = filters.search.trim();
    parts.push({
      OR: [
        { name: { contains: s, mode: "insensitive" } },
        { description: { contains: s, mode: "insensitive" } },
      ],
    });
  }

  if (filters.statusIds?.length) {
    parts.push({ statusId: { in: filters.statusIds } });
  }

  if (filters.priorityId) {
    parts.push({ priorityId: filters.priorityId });
  }

  if (filters.labelIds?.length) {
    parts.push({
      labels: { some: { labelId: { in: filters.labelIds } } },
    });
  }

  return parts;
}

export function buildTaskWhere(
  projectId: string,
  filters: TaskFilterState,
  options?: BuildTaskWhereOptions,
): Prisma.TaskWhereInput {
  const parts: Prisma.TaskWhereInput[] = [
    { projectId },
    ...collectFilterParts(filters, options),
  ];
  if (parts.length === 1) return parts[0] as Prisma.TaskWhereInput;
  return { AND: parts };
}

/** All tasks across projects owned by the user (for cross-project list / inbox). */
export function buildUserTaskWhere(
  userId: string,
  filters: TaskFilterState,
  options?: BuildTaskWhereOptions,
): Prisma.TaskWhereInput {
  const parts: Prisma.TaskWhereInput[] = [
    { project: { userId } },
    ...collectFilterParts(filters, options),
  ];
  if (parts.length === 1) return parts[0] as Prisma.TaskWhereInput;
  return { AND: parts };
}
