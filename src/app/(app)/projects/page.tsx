import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ProjectsPageClient } from "@/app/(app)/projects/projects-page-client";
import { listProjectBoardMetaForUser } from "@/lib/projects/list-project-board-meta-for-user";
import { listProjectsWithStatusBreakdown } from "@/lib/projects/list-projects-with-status-breakdown";
import { listAllTasksForUserBoard } from "@/lib/tasks/list-all-tasks-for-user";
import { getInboxPreferencesForScope } from "@/lib/inbox/get-inbox-preferences";
import { inboxPreferencesScopeProjectsOverview } from "@/lib/inbox/inbox-table-scope";
import { listInboxTasksForUserBoard } from "@/lib/tasks/list-inbox-tasks-for-user";
import {
  boardViewFromSearchParams,
  parseTaskFiltersFromSearchParams,
} from "@/lib/tasks/task-filters";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProjectsPage({ searchParams }: Props) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const sp = await searchParams;
  const view = boardViewFromSearchParams(sp);
  const filters = parseTaskFiltersFromSearchParams(sp);

  const [projects, tasksRaw, boardMetaRows, inboxPrefsResult] = await Promise.all([
    listProjectsWithStatusBreakdown(userId),
    view === "inbox"
      ? listInboxTasksForUserBoard(userId, filters)
      : listAllTasksForUserBoard(userId),
    listProjectBoardMetaForUser(userId),
    getInboxPreferencesForScope(
      userId,
      inboxPreferencesScopeProjectsOverview(),
    ),
  ]);

  const boardMetaByProjectId = Object.fromEntries(
    boardMetaRows.map((m) => [
      m.id,
      { labels: m.labels, priorities: m.priorities, statuses: m.statuses },
    ]),
  );

  const serialized = JSON.parse(
    JSON.stringify({
      projects,
      allTasks: tasksRaw,
      boardMetaByProjectId,
      searchParamsRecord: sp,
      inboxPreferences: inboxPrefsResult.prefs,
      inboxPreferencesFromDb: inboxPrefsResult.fromDb,
    }),
  );

  return (
    <ProjectsPageClient
      projects={serialized.projects}
      allTasks={serialized.allTasks}
      boardMetaByProjectId={serialized.boardMetaByProjectId}
      searchParamsRecord={serialized.searchParamsRecord}
      inboxPreferencesInitial={serialized.inboxPreferences}
      inboxPreferencesFromDb={serialized.inboxPreferencesFromDb}
    />
  );
}
