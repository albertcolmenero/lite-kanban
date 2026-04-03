"use client";

import { CreateTaskDialog } from "@/app/(app)/projects/[id]/board/create-task-dialog";
import { ProjectFilterModal } from "@/app/(app)/projects/[id]/board/project-filter-modal";
import { ProjectSettingsModal } from "@/app/(app)/projects/[id]/board/project-settings-modal";
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
}: {
  projectId: string;
  projectName: string;
  projectDescription: string | null;
  statuses: SerializedStatus[];
  priorities: SerializedPriority[];
  labels: SerializedProjectLabel[];
}) {
  return (
    <div className="sticky top-0 z-20 border-b border-border/50 bg-background/95 px-4 py-2.5 backdrop-blur-md supports-backdrop-filter:bg-background/80 sm:px-6">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-end gap-2">
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
        <CreateTaskDialog
          projectId={projectId}
          statuses={statuses}
          priorities={priorities}
        />
      </div>
    </div>
  );
}
