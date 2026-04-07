"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { InboxDataTable } from "@/components/inbox/inbox-data-table";
import type { InboxPreferencesPersistedV1 } from "@/lib/inbox/inbox-preferences-schema";
import { inboxPreferencesScopeProject } from "@/lib/inbox/inbox-table-scope";
import { OPEN_PROJECT_TASK_EVENT } from "@/lib/board/open-task-event";
import { CreateTaskDialog } from "@/app/(app)/projects/[id]/board/create-task-dialog";
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
import {
  PROJECT_TINT_ALPHA,
  projectColorToRgba,
} from "@/lib/projects/project-color";
import { boardViewFromSearchParams } from "@/lib/tasks/task-filters";
import { cn } from "@/lib/utils";

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return target.closest("[contenteditable=\"true\"]") != null;
}

function isInProjectTaskSearch(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return target.closest("[data-project-task-search]") != null;
}

export function ProjectBoardClient({
  projectId,
  projectName,
  projectDescription,
  projectColor,
  statuses,
  priorities,
  labels,
  tasks,
  allTasks,
  searchParamsRecord,
  inboxPreferencesInitial,
  inboxPreferencesFromDb,
}: {
  projectId: string;
  projectName: string;
  projectDescription: string | null;
  projectColor: string | null;
  statuses: SerializedStatus[];
  priorities: SerializedPriority[];
  labels: SerializedProjectLabel[];
  tasks: SerializedBoardTask[];
  allTasks: SerializedBoardTask[];
  searchParamsRecord: Record<string, string | string[] | undefined>;
  inboxPreferencesInitial: InboxPreferencesPersistedV1;
  inboxPreferencesFromDb: boolean;
}) {
  const view = boardViewFromSearchParams(searchParamsRecord);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createStatusId, setCreateStatusId] = useState<string | null>(null);
  const [createFormKey, setCreateFormKey] = useState(0);

  const openTask = useMemo(() => {
    if (!openTaskId) return null;
    return allTasks.find((t) => t.id === openTaskId) ?? null;
  }, [allTasks, openTaskId]);

  const defaultCreateStatusId =
    createStatusId ?? statuses[0]?.id ?? "";

  const openNewTask = useCallback((statusId?: string | null) => {
    setCreateStatusId(
      statusId !== undefined && statusId !== null && statusId !== ""
        ? statusId
        : null,
    );
    setCreateFormKey((k) => k + 1);
    setCreateOpen(true);
  }, []);

  useEffect(() => {
    function onOpen(e: Event) {
      const ce = e as CustomEvent<{ taskId: string }>;
      if (ce.detail?.taskId) setOpenTaskId(ce.detail.taskId);
    }
    window.addEventListener(OPEN_PROJECT_TASK_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_PROJECT_TASK_EVENT, onOpen);
  }, []);

  useEffect(() => {
    // #region agent log
    fetch("http://127.0.0.1:7799/ingest/d0877993-cce7-4746-af40-c3c53f505f88", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "3c39b6",
      },
      body: JSON.stringify({
        sessionId: "3c39b6",
        runId: "pre-fix",
        hypothesisId: "H4",
        location: "project-board-client.tsx:board-state",
        message: "board modal/task ids",
        data: { createOpen, openTaskId },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  }, [createOpen, openTaskId]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key.toLowerCase() !== "c") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;
      if (isInProjectTaskSearch(e.target)) return;
      e.preventDefault();
      openNewTask(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openNewTask]);

  const boardBgStyle =
    projectColor != null && projectColor !== ""
      ? {
          background: `linear-gradient(to bottom, ${projectColorToRgba(projectColor, PROJECT_TINT_ALPHA)}, var(--background) 52%, var(--background))`,
        }
      : undefined;

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col",
        !boardBgStyle && "bg-gradient-to-b from-muted/25 via-background to-background",
      )}
      style={boardBgStyle}
    >
      <ProjectBoardTopBar
        projectId={projectId}
        projectName={projectName}
        projectDescription={projectDescription}
        projectColor={projectColor}
        statuses={statuses}
        priorities={priorities}
        labels={labels}
        onNewTask={() => openNewTask(null)}
      />

      <CreateTaskDialog
        projectId={projectId}
        statuses={statuses}
        priorities={priorities}
        labels={labels}
        open={createOpen}
        onOpenChange={(v) => {
          setCreateOpen(v);
          if (!v) setCreateStatusId(null);
        }}
        defaultStatusId={defaultCreateStatusId}
        formKey={createFormKey}
      />

      <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col px-4 py-6 sm:px-6">
        {view === "grid" ? (
          <KanbanBoard
            projectId={projectId}
            statuses={statuses}
            tasks={tasks}
            onOpenTask={(id) => setOpenTaskId(id)}
            onRequestNewTask={(statusId) => openNewTask(statusId)}
          />
        ) : view === "inbox" ? (
          tasks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 px-6 py-12 text-center">
              <p className="text-sm text-muted-foreground">
                No pending tasks. Tasks in a final column stay out of the inbox.
              </p>
            </div>
          ) : (
            <InboxDataTable
              projectNamesById={{ [projectId]: projectName }}
              projectColorsById={{ [projectId]: projectColor }}
              tasks={tasks}
              preferencesScope={inboxPreferencesScopeProject(projectId)}
              initialPreferences={inboxPreferencesInitial}
              preferencesFromDb={inboxPreferencesFromDb}
              onOpenTask={(id) => setOpenTaskId(id)}
            />
          )
        ) : (
          <TaskListBoard
            projectNamesById={{ [projectId]: projectName }}
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
        statuses={statuses}
      />
    </div>
  );
}
