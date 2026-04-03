import { prisma } from "@/lib/db";

export async function createProjectLabel(
  userId: string,
  projectId: string,
  name: string,
  color: string,
) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
  });
  if (!project) return { ok: false as const, error: "Project not found" };

  try {
    const label = await prisma.projectLabel.create({
      data: { projectId, name, color },
    });
    return { ok: true as const, label };
  } catch {
    return { ok: false as const, error: "Could not create label (duplicate name?)" };
  }
}
