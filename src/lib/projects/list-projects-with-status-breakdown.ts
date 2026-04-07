import { prisma } from "@/lib/db";

export type ProjectStatusBreakdown = {
  id: string;
  name: string;
  sortOrder: number;
  taskCount: number;
};

export type ProjectListRow = {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  updatedAt: Date;
  statuses: ProjectStatusBreakdown[];
};

export async function listProjectsWithStatusBreakdown(
  userId: string,
): Promise<ProjectListRow[]> {
  const projects = await prisma.project.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    include: {
      statuses: { orderBy: { sortOrder: "asc" } },
    },
  });

  const taskCounts = await prisma.task.groupBy({
    by: ["projectId", "statusId"],
    where: { project: { userId } },
    _count: { _all: true },
  });

  const countByProject = new Map<string, Map<string, number>>();
  for (const row of taskCounts) {
    let inner = countByProject.get(row.projectId);
    if (!inner) {
      inner = new Map();
      countByProject.set(row.projectId, inner);
    }
    inner.set(row.statusId, row._count._all);
  }

  return projects.map((p) => {
    const counts = countByProject.get(p.id);
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      color: p.color,
      updatedAt: p.updatedAt,
      statuses: p.statuses.map((s) => ({
        id: s.id,
        name: s.name,
        sortOrder: s.sortOrder,
        taskCount: counts?.get(s.id) ?? 0,
      })),
    };
  });
}
