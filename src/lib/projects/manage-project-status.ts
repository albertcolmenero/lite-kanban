import { prisma } from "@/lib/db";

export async function createOwnedProjectStatus(
  userId: string,
  projectId: string,
  name: string,
) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true },
  });
  if (!project) return { ok: false as const, error: "Project not found" };

  const max = await prisma.projectStatus.aggregate({
    where: { projectId },
    _max: { sortOrder: true },
  });
  const sortOrder = (max._max.sortOrder ?? -1) + 1;

  try {
    await prisma.projectStatus.create({
      data: { projectId, name, sortOrder },
    });
  } catch {
    return { ok: false as const, error: "A column with that name already exists" };
  }

  return { ok: true as const };
}

export async function updateOwnedProjectStatus(
  userId: string,
  statusId: string,
  name: string,
) {
  const row = await prisma.projectStatus.findFirst({
    where: { id: statusId, project: { userId } },
    select: { id: true, projectId: true },
  });
  if (!row) return { ok: false as const, error: "Column not found" };

  try {
    await prisma.projectStatus.update({
      where: { id: row.id },
      data: { name },
    });
  } catch {
    return { ok: false as const, error: "A column with that name already exists" };
  }

  return { ok: true as const, projectId: row.projectId };
}

export async function deleteOwnedProjectStatus(userId: string, statusId: string) {
  const row = await prisma.projectStatus.findFirst({
    where: { id: statusId, project: { userId } },
    select: {
      id: true,
      projectId: true,
      _count: { select: { tasks: true } },
    },
  });
  if (!row) return { ok: false as const, error: "Column not found" };
  if (row._count.tasks > 0) {
    return {
      ok: false as const,
      error: "Move or delete tasks in this column before removing it",
    };
  }

  const remaining = await prisma.projectStatus.count({
    where: { projectId: row.projectId },
  });
  if (remaining <= 1) {
    return {
      ok: false as const,
      error: "Projects must keep at least one column",
    };
  }

  await prisma.projectStatus.delete({ where: { id: row.id } });
  return { ok: true as const, projectId: row.projectId };
}

export async function moveOwnedProjectStatus(
  userId: string,
  statusId: string,
  direction: "up" | "down",
) {
  const row = await prisma.projectStatus.findFirst({
    where: { id: statusId, project: { userId } },
    select: { id: true, projectId: true, sortOrder: true },
  });
  if (!row) return { ok: false as const, error: "Column not found" };

  const ordered = await prisma.projectStatus.findMany({
    where: { projectId: row.projectId },
    orderBy: { sortOrder: "asc" },
    select: { id: true, sortOrder: true },
  });

  const idx = ordered.findIndex((s) => s.id === row.id);
  const swapWith = direction === "up" ? idx - 1 : idx + 1;
  if (swapWith < 0 || swapWith >= ordered.length) {
    return { ok: true as const, projectId: row.projectId };
  }

  const a = ordered[idx];
  const b = ordered[swapWith];

  await prisma.$transaction([
    prisma.projectStatus.update({
      where: { id: a.id },
      data: { sortOrder: b.sortOrder },
    }),
    prisma.projectStatus.update({
      where: { id: b.id },
      data: { sortOrder: a.sortOrder },
    }),
  ]);

  return { ok: true as const, projectId: row.projectId };
}
