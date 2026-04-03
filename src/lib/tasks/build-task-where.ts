import type { Prisma } from "@/generated/prisma/client";
import type { TaskFilterState } from "@/lib/tasks/task-filters";

export function buildTaskWhere(
  projectId: string,
  filters: TaskFilterState,
): Prisma.TaskWhereInput {
  const parts: Prisma.TaskWhereInput[] = [{ projectId }];

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

  if (parts.length === 1) return parts[0] as Prisma.TaskWhereInput;
  return { AND: parts };
}
