"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UpdateProjectForm } from "@/app/(app)/projects/[id]/update-project-form";
import { ManageBoardColumnsTab } from "@/app/(app)/projects/[id]/board/manage-board-columns-tab";
import { ManageLabelsTab } from "@/app/(app)/projects/[id]/board/manage-labels-tab";
import type {
  SerializedProjectLabel,
  SerializedStatus,
} from "@/app/(app)/projects/[id]/board/types";
import { Settings } from "lucide-react";

export function ProjectSettingsModal({
  projectId,
  projectName,
  projectDescription,
  labels,
  statuses,
}: {
  projectId: string;
  projectName: string;
  projectDescription: string | null;
  labels: SerializedProjectLabel[];
  statuses: SerializedStatus[];
}) {
  const [open, setOpen] = useState(false);
  const [generalFormKey, setGeneralFormKey] = useState(0);
  const [labelFormKey, setLabelFormKey] = useState(0);

  const handleSaved = useCallback(() => setOpen(false), []);
  const handleLabelAdded = useCallback(() => {
    setLabelFormKey((k) => k + 1);
  }, []);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setGeneralFormKey((k) => k + 1);
      }}
    >
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Project settings"
            className="shrink-0"
          />
        }
      >
        <Settings className="size-4" />
      </DialogTrigger>
      <DialogContent className="max-h-[min(90vh,640px)] overflow-hidden p-0 sm:max-w-lg">
        <div className="border-b border-border/60 px-4 pt-4 pb-3 sm:px-6">
          <DialogHeader className="gap-1 text-left">
            <DialogTitle>Project settings</DialogTitle>
            <DialogDescription>
              General info, labels, and Kanban columns for this project.
            </DialogDescription>
          </DialogHeader>
        </div>
        <Tabs defaultValue="general" className="gap-0">
          <div className="border-b border-border/60 px-4 sm:px-6">
            <TabsList
              variant="line"
              className="h-10 w-full flex-wrap justify-start gap-x-4 gap-y-1 bg-transparent p-0"
            >
              <TabsTrigger value="general" className="rounded-none px-0">
                General
              </TabsTrigger>
              <TabsTrigger value="labels" className="rounded-none px-0">
                Labels
              </TabsTrigger>
              <TabsTrigger value="columns" className="rounded-none px-0">
                Columns
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent
            value="general"
            className="max-h-[min(60vh,420px)] overflow-y-auto px-4 py-4 sm:px-6"
          >
            <UpdateProjectForm
              key={generalFormKey}
              projectId={projectId}
              name={projectName}
              description={projectDescription}
              onSaved={handleSaved}
            />
          </TabsContent>
          <TabsContent
            value="labels"
            className="max-h-[min(60vh,480px)] overflow-y-auto px-4 py-4 sm:px-6"
          >
            <ManageLabelsTab
              projectId={projectId}
              labels={labels}
              newLabelFormKey={labelFormKey}
              onLabelAdded={handleLabelAdded}
            />
          </TabsContent>
          <TabsContent
            value="columns"
            className="max-h-[min(60vh,480px)] overflow-y-auto px-4 py-4 sm:px-6"
          >
            <ManageBoardColumnsTab projectId={projectId} statuses={statuses} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
