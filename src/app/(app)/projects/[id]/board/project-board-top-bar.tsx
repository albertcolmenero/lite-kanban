"use client";

import { ProjectFilterModal } from "@/app/(app)/projects/[id]/board/project-filter-modal";
import { ProjectSettingsModal } from "@/app/(app)/projects/[id]/board/project-settings-modal";
import { ProjectsViewToggle } from "@/components/projects-view-toggle";
import { Button } from "@/components/ui/button";
import type {
  SerializedPriority,
  SerializedProjectLabel,
  SerializedStatus,
} from "@/app/(app)/projects/[id]/board/types";

export function ProjectBoardTopBar({
  projectId,
  projectName,
  projectDescription,
  statuses,
  priorities,
  labels,
  onNewTask,
}: {
  projectId: string;
  projectName: string;
  projectDescription: string | null;
  statuses: SerializedStatus[];
  priorities: SerializedPriority[];
  labels: SerializedProjectLabel[];
  onNewTask: () => void;
}) {
  return (
    <div className="sticky top-0 z-20 border-b border-border/50 bg-background/95 px-4 py-2.5 backdrop-blur-md supports-backdrop-filter:bg-background/80 sm:px-6">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-2">
        <ProjectsViewToggle />
        <div className="flex flex-wrap items-center justify-end gap-2">
        <ProjectFilterModal
          statuses={statuses}
          priorities={priorities}
          labels={labels}
        />
        <ProjectSettingsModal
          projectId={projectId}
          projectName={projectName}
          projectDescription={projectDescription}
          labels={labels}
          statuses={statuses}
        />
        <Button
          type="button"
          size="sm"
          onClick={onNewTask}
          className="gap-2"
        >
          New task
          <kbd className="pointer-events-none hidden h-5 select-none items-center gap-0.5 rounded border border-border/80 bg-muted/60 px-1.5 font-mono text-[0.65rem] font-medium text-muted-foreground sm:inline-flex">
            C
          </kbd>
        </Button>
        </div>
      </div>
    </div>
  );
}
