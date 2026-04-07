import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { ProjectBoardClient } from "@/app/(app)/projects/[id]/board/project-board-client";
import { getInboxPreferencesForScope } from "@/lib/inbox/get-inbox-preferences";
import { inboxPreferencesScopeProject } from "@/lib/inbox/inbox-table-scope";
import { getCachedProjectBoardShell } from "@/lib/projects/get-cached-project-shell";
import { listTasksForBoard } from "@/lib/tasks/list-tasks-for-board";
import {
  boardViewFromSearchParams,
  parseTaskFiltersFromSearchParams,
} from "@/lib/tasks/task-filters";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProjectDetailPage({ params, searchParams }: Props) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { id } = await params;
  const sp = await searchParams;

  const [shell, inboxPrefsResult] = await Promise.all([
    getCachedProjectBoardShell(id),
    getInboxPreferencesForScope(userId, inboxPreferencesScopeProject(id)),
  ]);
  if (!shell) notFound();

  const { project, allTasks: allTasksRaw } = shell;
  const filters = parseTaskFiltersFromSearchParams(sp);
  const view = boardViewFromSearchParams(sp);
  const tasks = await listTasksForBoard(userId, project.id, filters, {
    inboxPendingOnly: view === "inbox",
  });

  const serialized = JSON.parse(
    JSON.stringify({
      tasks,
      allTasks: allTasksRaw,
      sp,
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        color: project.color,
      },
      inboxPreferences: inboxPrefsResult.prefs,
      inboxPreferencesFromDb: inboxPrefsResult.fromDb,
    }),
  );

  return (
    <ProjectBoardClient
      projectId={serialized.project.id}
      projectName={serialized.project.name}
      projectDescription={serialized.project.description}
      projectColor={serialized.project.color}
      statuses={JSON.parse(JSON.stringify(project.statuses))}
      priorities={JSON.parse(JSON.stringify(project.priorities))}
      labels={JSON.parse(JSON.stringify(project.labels))}
      tasks={serialized.tasks}
      allTasks={serialized.allTasks}
      searchParamsRecord={serialized.sp}
      inboxPreferencesInitial={serialized.inboxPreferences}
      inboxPreferencesFromDb={serialized.inboxPreferencesFromDb}
    />
  );
}

export async function generateMetadata({ params }: Props) {
  const { userId } = await auth();
  if (!userId) return { title: "Project" };
  const { id } = await params;
  const shell = await getCachedProjectBoardShell(id);
  return { title: shell?.project.name ?? "Project" };
}
