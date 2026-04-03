"use client";

import { useActionState, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createLabelInlineAction,
  createTaskBoardAction,
  type BoardActionState,
} from "@/app/(app)/projects/[id]/board-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SearchableMultiSelect } from "@/components/ui/searchable-multi-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type {
  SerializedPriority,
  SerializedProjectLabel,
  SerializedStatus,
} from "@/app/(app)/projects/[id]/board/types";

function NewTaskFormFields({
  action,
  pending,
  error,
  projectId,
  statuses,
  priorities,
  labels,
  defaultStatusId,
}: {
  action: (payload: FormData) => void;
  pending: boolean;
  error?: string;
  projectId: string;
  statuses: SerializedStatus[];
  priorities: SerializedPriority[];
  labels: SerializedProjectLabel[];
  defaultStatusId: string;
}) {
  const router = useRouter();
  const [labelSet, setLabelSet] = useState(() => new Set<string>());
  const [extraLabels, setExtraLabels] = useState<SerializedProjectLabel[]>([]);

  useEffect(() => {
    setExtraLabels((prev) =>
      prev.filter((e) => !labels.some((l) => l.id === e.id)),
    );
  }, [labels]);

  const defaultPriority =
    priorities.find((p) => p.name === "Medium")?.id ?? priorities[0]?.id ?? "";

  const labelIdsValue = useMemo(() => [...labelSet].join(","), [labelSet]);

  const mergedLabels = useMemo(() => {
    const seen = new Set<string>();
    const out: SerializedProjectLabel[] = [];
    for (const lb of labels) {
      if (seen.has(lb.id)) continue;
      seen.add(lb.id);
      out.push(lb);
    }
    for (const lb of extraLabels) {
      if (seen.has(lb.id)) continue;
      seen.add(lb.id);
      out.push(lb);
    }
    return out;
  }, [labels, extraLabels]);

  const labelOptions = useMemo(
    () =>
      mergedLabels.map((lb) => ({
        value: lb.id,
        label: lb.name,
        color: lb.color,
      })),
    [mergedLabels],
  );

  const onCreateLabel = useCallback(
    async (trimmed: string) => {
      const r = await createLabelInlineAction(projectId, trimmed);
      if (!r.ok) return { ok: false as const, error: r.error };
      setExtraLabels((prev) =>
        prev.some((l) => l.id === r.label.id) ? prev : [...prev, r.label],
      );
      router.refresh();
      return {
        ok: true as const,
        option: {
          value: r.label.id,
          label: r.label.name,
          color: r.label.color,
        },
      };
    },
    [projectId, router],
  );

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="labelIds" value={labelIdsValue} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tn">Name</Label>
        <Input id="tn" name="name" required maxLength={200} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="td">Description</Label>
        <Textarea id="td" name="description" rows={3} maxLength={5000} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tdd">Due date</Label>
        <Input id="tdd" name="dueDate" type="date" className="w-full" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ts">Status</Label>
          <select
            id="ts"
            name="statusId"
            defaultValue={defaultStatusId}
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
      <div className="space-y-2">
        <Label htmlFor="new-task-labels">Labels</Label>
        <SearchableMultiSelect
          id="new-task-labels"
          options={labelOptions}
          value={[...labelSet]}
          onValueChange={(ids) => setLabelSet(new Set(ids))}
          placeholder="Search or type to add a label…"
          searchPlaceholder="Add more…"
          emptyText={
            mergedLabels.length === 0
              ? "Type a name and pick Create to add your first label"
              : "No labels match"
          }
          onCreateOption={onCreateLabel}
        />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create"}
      </Button>
    </form>
  );
}

export function CreateTaskDialog({
  projectId,
  statuses,
  priorities,
  labels,
  open,
  onOpenChange,
  defaultStatusId,
  formKey,
}: {
  projectId: string;
  statuses: SerializedStatus[];
  priorities: SerializedPriority[];
  labels: SerializedProjectLabel[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultStatusId: string;
  formKey: number;
}) {
  const [state, action, pending] = useActionState(
    createTaskBoardAction,
    {} as BoardActionState,
  );

  useEffect(() => {
    if (!state.ok) return;
    onOpenChange(false);
  }, [state.ok, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New task</DialogTitle>
        </DialogHeader>
        <NewTaskFormFields
          key={formKey}
          action={action}
          pending={pending}
          error={state.error}
          projectId={projectId}
          statuses={statuses}
          priorities={priorities}
          labels={labels}
          defaultStatusId={defaultStatusId}
        />
      </DialogContent>
    </Dialog>
  );
}
