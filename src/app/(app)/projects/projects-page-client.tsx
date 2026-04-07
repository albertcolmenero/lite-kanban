"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { InboxDataTable } from "@/components/inbox/inbox-data-table";
import type { InboxPreferencesPersistedV1 } from "@/lib/inbox/inbox-preferences-schema";
import { inboxPreferencesScopeProjectsOverview } from "@/lib/inbox/inbox-table-scope";
import { TaskDetailDialog } from "@/app/(app)/projects/[id]/board/task-detail-dialog";
import { TaskListBoard } from "@/app/(app)/projects/[id]/board/task-list-board";
import type {
  SerializedBoardTask,
  SerializedPriority,
  SerializedProjectLabel,
  SerializedStatus,
} from "@/app/(app)/projects/[id]/board/types";
import { CreateProjectDialog } from "@/app/(app)/projects/create-project-dialog";
import { DeleteProjectButton } from "@/app/(app)/projects/delete-project-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProjectsViewToggle } from "@/components/projects-view-toggle";
import type { ProjectListRow } from "@/lib/projects/list-projects-with-status-breakdown";
import {
  PROJECT_TINT_ALPHA,
  projectColorToRgba,
} from "@/lib/projects/project-color";
import { boardViewFromSearchParams } from "@/lib/tasks/task-filters";

type ProjectBoardMeta = {
  labels: SerializedProjectLabel[];
  priorities: SerializedPriority[];
  statuses: SerializedStatus[];
};

export function ProjectsPageClient({
  projects,
  allTasks,
  boardMetaByProjectId,
  searchParamsRecord,
  inboxPreferencesInitial,
  inboxPreferencesFromDb,
}: {
  projects: ProjectListRow[];
  allTasks: SerializedBoardTask[];
  boardMetaByProjectId: Record<string, ProjectBoardMeta>;
  searchParamsRecord: Record<string, string | string[] | undefined>;
  inboxPreferencesInitial: InboxPreferencesPersistedV1;
  inboxPreferencesFromDb: boolean;
}) {
  const view = boardViewFromSearchParams(searchParamsRecord);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);

  const projectNamesById = useMemo(
    () => Object.fromEntries(projects.map((p) => [p.id, p.name])),
    [projects],
  );

  const projectColorsById = useMemo(
    () => Object.fromEntries(projects.map((p) => [p.id, p.color ?? null])),
    [projects],
  );

  const openTask = useMemo(() => {
    if (!openTaskId) return null;
    return allTasks.find((t) => t.id === openTaskId) ?? null;
  }, [allTasks, openTaskId]);

  const dialogMeta = useMemo(() => {
    if (!openTask) {
      return {
        labels: [] as SerializedProjectLabel[],
        priorities: [] as SerializedPriority[],
        statuses: [] as SerializedStatus[],
      };
    }
    const raw = boardMetaByProjectId[openTask.projectId];
    return {
      labels: raw?.labels ?? [],
      priorities: raw?.priorities ?? [],
      statuses: raw?.statuses ?? [],
    };
  }, [openTask, boardMetaByProjectId]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">
            {view === "grid"
              ? "Task counts by status for each board."
              : view === "inbox"
                ? "Pending tasks in a filterable, sortable table."
                : "All your tasks, sorted by priority."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ProjectsViewToggle />
          <CreateProjectDialog />
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            No projects yet. Create one with{" "}
            <span className="font-medium text-foreground">New project</span>.
          </p>
        </div>
      ) : view === "grid" ? (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <li key={p.id} className="min-w-0">
              <Card className="flex h-full flex-col transition-shadow hover:shadow-md">
                <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 border-b border-border/60 pb-4">
                  <div className="min-w-0 flex-1 space-y-1">
                    <CardTitle className="text-base leading-snug">
                      <Link
                        href={`/projects/${p.id}`}
                        className="hover:underline"
                      >
                        {p.name}
                      </Link>
                    </CardTitle>
                    {p.description ? (
                      <CardDescription className="line-clamp-2">
                        {p.description}
                      </CardDescription>
                    ) : null}
                  </div>
                  <DeleteProjectButton projectId={p.id} projectName={p.name} />
                </CardHeader>
                <CardContent className="flex flex-1 flex-col pt-4">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Tasks by status
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {p.statuses.map((s) => (
                      <span
                        key={s.id}
                        className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs"
                      >
                        <span className="font-medium">{s.name}</span>
                        <span className="tabular-nums text-muted-foreground">
                          {s.taskCount}
                        </span>
                      </span>
                    ))}
                  </div>
                </CardContent>
                <CardFooter
                  className="mt-auto border-t border-border/60 pt-4"
                  style={
                    p.color
                      ? {
                          backgroundColor: projectColorToRgba(
                            p.color,
                            PROJECT_TINT_ALPHA,
                          ),
                        }
                      : undefined
                  }
                >
                  <Link
                    href={`/projects/${p.id}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Open project
                  </Link>
                </CardFooter>
              </Card>
            </li>
          ))}
        </ul>
      ) : allTasks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {view === "inbox"
              ? "No pending tasks. Tasks in a final column stay out of the inbox."
              : "No tasks yet. Open a project to add tasks."}
          </p>
        </div>
      ) : view === "inbox" ? (
        <InboxDataTable
          projectNamesById={projectNamesById}
          projectColorsById={projectColorsById}
          tasks={allTasks}
          preferencesScope={inboxPreferencesScopeProjectsOverview()}
          initialPreferences={inboxPreferencesInitial}
          preferencesFromDb={inboxPreferencesFromDb}
          onOpenTask={(id) => setOpenTaskId(id)}
        />
      ) : (
        <TaskListBoard
          projectNamesById={projectNamesById}
          tasks={allTasks}
          onOpenTask={(id) => setOpenTaskId(id)}
        />
      )}

      <TaskDetailDialog
        task={openTask}
        open={openTask !== null}
        onOpenChange={(v) => {
          if (!v) setOpenTaskId(null);
        }}
        projectId={openTask?.projectId ?? ""}
        projectLabels={dialogMeta.labels}
        priorities={dialogMeta.priorities}
        statuses={dialogMeta.statuses}
      />
    </div>
  );
}
