import { cache } from "react";
import { auth } from "@clerk/nextjs/server";
import { getOwnedProject } from "@/lib/projects/get-project-by-id";
import { listAllBoardTasksForProject } from "@/lib/tasks/list-all-board-tasks";

/** Deduped per request for project layout + board page. */
export const getCachedProjectBoardShell = cache(async (projectId: string) => {
  const { userId } = await auth();
  if (!userId) return null;
  const project = await getOwnedProject(userId, projectId);
  if (!project) return null;
  const allTasks = await listAllBoardTasksForProject(userId, project.id);
  return { project, allTasks };
});
