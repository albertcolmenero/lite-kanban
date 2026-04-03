"use client";

import { useActionState, useEffect, useState } from "react";
import { createTaskBoardAction, type BoardActionState } from "@/app/(app)/projects/[id]/board-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type {
  SerializedPriority,
  SerializedStatus,
} from "@/app/(app)/projects/[id]/board/types";

export function CreateTaskDialog({
  projectId,
  statuses,
  priorities,
}: {
  projectId: string;
  statuses: SerializedStatus[];
  priorities: SerializedPriority[];
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(
    createTaskBoardAction,
    {} as BoardActionState,
  );

  useEffect(() => {
    if (!state.ok) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- close after successful create
    setOpen(false);
  }, [state.ok]);

  const defaultStatus = statuses[0]?.id ?? "";
  const defaultPriority =
    priorities.find((p) => p.name === "Medium")?.id ?? priorities[0]?.id ?? "";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm">New task</Button>} />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New task</DialogTitle>
        </DialogHeader>
        <form action={action} className="flex flex-col gap-3">
          <input type="hidden" name="projectId" value={projectId} />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tn">Name</Label>
            <Input id="tn" name="name" required maxLength={200} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="td">Description</Label>
            <Textarea id="td" name="description" rows={3} maxLength={5000} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ts">Status</Label>
              <select
                id="ts"
                name="statusId"
                defaultValue={defaultStatus}
                className="h-8 rounded-md border border-input bg-background px-2 text-sm"
              >
                {statuses.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tp">Priority</Label>
              <select
                id="tp"
                name="priorityId"
                defaultValue={defaultPriority}
                className="h-8 rounded-md border border-input bg-background px-2 text-sm"
              >
                {priorities.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {state.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}
          <Button type="submit" disabled={pending}>
            {pending ? "Creating…" : "Create"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
