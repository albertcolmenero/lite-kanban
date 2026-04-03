import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { ProjectBoardClient } from "@/app/(app)/projects/[id]/board/project-board-client";
import { getCachedProjectBoardShell } from "@/lib/projects/get-cached-project-shell";
import { listTasksForBoard } from "@/lib/tasks/list-tasks-for-board";
import { parseTaskFiltersFromSearchParams } from "@/lib/tasks/task-filters";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProjectDetailPage({ params, searchParams }: Props) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { id } = await params;
  const sp = await searchParams;

  const shell = await getCachedProjectBoardShell(id);
  if (!shell) notFound();

  const { project, allTasks: allTasksRaw } = shell;
  const filters = parseTaskFiltersFromSearchParams(sp);
  const tasks = await listTasksForBoard(userId, project.id, filters);

  const serialized = JSON.parse(
    JSON.stringify({
      tasks,
      allTasks: allTasksRaw,
      sp,
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
      },
    }),
  );

  return (
    <ProjectBoardClient
      projectId={serialized.project.id}
      projectName={serialized.project.name}
      projectDescription={serialized.project.description}
      statuses={JSON.parse(JSON.stringify(project.statuses))}
      priorities={JSON.parse(JSON.stringify(project.priorities))}
      labels={JSON.parse(JSON.stringify(project.labels))}
      tasks={serialized.tasks}
      allTasks={serialized.allTasks}
      searchParamsRecord={serialized.sp}
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
