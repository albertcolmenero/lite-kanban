"use client";

import { useEffect, useMemo, useState } from "react";
import {
  OPEN_PROJECT_TASK_EVENT,
} from "@/lib/board/open-task-event";
import { KanbanBoard } from "@/app/(app)/projects/[id]/board/kanban-board";
import { ProjectBoardTopBar } from "@/app/(app)/projects/[id]/board/project-board-top-bar";
import { TaskDetailDialog } from "@/app/(app)/projects/[id]/board/task-detail-dialog";
import { TaskListBoard } from "@/app/(app)/projects/[id]/board/task-list-board";
import type {
  SerializedBoardTask,
  SerializedPriority,
  SerializedProjectLabel,
  SerializedStatus,
} from "@/app/(app)/projects/[id]/board/types";
import { boardViewFromSearchParams } from "@/lib/tasks/task-filters";

export function ProjectBoardClient({
  projectId,
  projectName,
  projectDescription,
  statuses,
  priorities,
  labels,
  tasks,
  allTasks,
  searchParamsRecord,
}: {
  projectId: string;
  projectName: string;
  projectDescription: string | null;
  statuses: SerializedStatus[];
  priorities: SerializedPriority[];
  labels: SerializedProjectLabel[];
  tasks: SerializedBoardTask[];
  allTasks: SerializedBoardTask[];
  searchParamsRecord: Record<string, string | string[] | undefined>;
}) {
  const view = boardViewFromSearchParams(searchParamsRecord);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);

  const openTask = useMemo(() => {
    if (!openTaskId) return null;
    return allTasks.find((t) => t.id === openTaskId) ?? null;
  }, [allTasks, openTaskId]);

  useEffect(() => {
    function onOpen(e: Event) {
      const ce = e as CustomEvent<{ taskId: string }>;
      if (ce.detail?.taskId) setOpenTaskId(ce.detail.taskId);
    }
    window.addEventListener(OPEN_PROJECT_TASK_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_PROJECT_TASK_EVENT, onOpen);
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-gradient-to-b from-muted/25 via-background to-background">
      <ProjectBoardTopBar
        projectId={projectId}
        projectName={projectName}
        projectDescription={projectDescription}
        statuses={statuses}
        priorities={priorities}
        labels={labels}
      />

      <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col px-4 py-6 sm:px-6">
        {view === "kanban" ? (
          <KanbanBoard
            projectId={projectId}
            statuses={statuses}
            tasks={tasks}
            onOpenTask={(id) => setOpenTaskId(id)}
          />
        ) : (
          <TaskListBoard
            statuses={statuses}
            tasks={tasks}
            onOpenTask={(id) => setOpenTaskId(id)}
          />
        )}
      </div>

      <TaskDetailDialog
        task={openTask}
        open={openTask !== null}
        onOpenChange={(v) => {
          if (!v) setOpenTaskId(null);
        }}
        projectId={projectId}
        projectLabels={labels}
        priorities={priorities}
      />
    </div>
  );
}
