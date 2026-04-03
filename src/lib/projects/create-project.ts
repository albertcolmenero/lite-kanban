import { prisma } from "@/lib/db";
import type { CreateProjectInput } from "@/lib/projects/schemas";
import {
  DEFAULT_PROJECT_PRIORITIES,
  DEFAULT_PROJECT_STATUSES,
} from "@/lib/projects/constants";

export async function createProjectWithDefaults(
  userId: string,
  input: CreateProjectInput,
) {
  return prisma.project.create({
    data: {
      userId,
      name: input.name,
      description: input.description?.length ? input.description : null,
      statuses: {
        create: [...DEFAULT_PROJECT_STATUSES],
      },
      priorities: {
        create: [...DEFAULT_PROJECT_PRIORITIES],
      },
    },
  });
}
