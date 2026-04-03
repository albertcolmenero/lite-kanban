import { prisma } from "@/lib/db";

export type ProjectBoardMetaRow = {
  id: string;
  labels: { id: string; name: string; color: string }[];
  priorities: { id: string; name: string; sortOrder: number }[];
};

export async function listProjectBoardMetaForUser(
  userId: string,
): Promise<ProjectBoardMetaRow[]> {
  return prisma.project.findMany({
    where: { userId },
    select: {
      id: true,
      labels: { orderBy: { name: "asc" } },
      priorities: { orderBy: { sortOrder: "asc" } },
    },
  });
}
