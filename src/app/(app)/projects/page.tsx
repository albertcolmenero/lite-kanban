import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ProjectsPageClient } from "@/app/(app)/projects/projects-page-client";
import { listProjectBoardMetaForUser } from "@/lib/projects/list-project-board-meta-for-user";
import { listProjectsWithStatusBreakdown } from "@/lib/projects/list-projects-with-status-breakdown";
import { listAllTasksForUserBoard } from "@/lib/tasks/list-all-tasks-for-user";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProjectsPage({ searchParams }: Props) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const sp = await searchParams;

  const [projects, tasksRaw, boardMetaRows] = await Promise.all([
    listProjectsWithStatusBreakdown(userId),
    listAllTasksForUserBoard(userId),
    listProjectBoardMetaForUser(userId),
  ]);

  const boardMetaByProjectId = Object.fromEntries(
    boardMetaRows.map((m) => [
      m.id,
      { labels: m.labels, priorities: m.priorities },
    ]),
  );

  const serialized = JSON.parse(
    JSON.stringify({
      projects,
      allTasks: tasksRaw,
      boardMetaByProjectId,
      searchParamsRecord: sp,
    }),
  );

  return (
    <ProjectsPageClient
      projects={serialized.projects}
      allTasks={serialized.allTasks}
      boardMetaByProjectId={serialized.boardMetaByProjectId}
      searchParamsRecord={serialized.searchParamsRecord}
    />
  );
}
