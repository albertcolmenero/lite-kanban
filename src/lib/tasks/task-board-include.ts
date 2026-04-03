import type { Prisma } from "@/generated/prisma/client";

/** Shared Prisma include for board task rows (kanban, list, detail dialog, search). */
export const taskBoardInclude = {
  status: true,
  priority: true,
  labels: { include: { label: true } },
  subtasks: { orderBy: { position: "asc" as const } },
  attachments: true,
  comments: { orderBy: { createdAt: "desc" as const }, take: 50 },
  activities: { orderBy: { createdAt: "desc" as const }, take: 50 },
} as const satisfies Prisma.TaskInclude;
