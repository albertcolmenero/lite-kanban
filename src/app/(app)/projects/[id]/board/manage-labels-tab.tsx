"use client";

import { useActionState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  deleteLabelBoardAction,
  updateLabelBoardAction,
  type BoardActionState,
} from "@/app/(app)/projects/[id]/board-actions";
import { NewLabelForm } from "@/app/(app)/projects/[id]/board/new-label-form";
import type { SerializedProjectLabel } from "@/app/(app)/projects/[id]/board/types";
import { LABEL_COLOR_OPTIONS } from "@/lib/board/constants";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: BoardActionState = {};

function LabelEditRow({
  label,
  projectId,
}: {
  label: SerializedProjectLabel;
  projectId: string;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(
    updateLabelBoardAction,
    initial,
  );

  const colorOptions = useMemo(() => {
    const preset = LABEL_COLOR_OPTIONS.some((c) => c.value === label.color);
    if (preset) return [...LABEL_COLOR_OPTIONS];
    return [
      { value: label.color, label: "Current" },
      ...LABEL_COLOR_OPTIONS,
    ];
  }, [label.color]);

  useEffect(() => {
    if (!state.ok) return;
    router.refresh();
  }, [state.ok, router]);

  return (
    <li className="flex flex-col gap-3 rounded-lg border border-border/60 bg-muted/20 p-3 sm:flex-row sm:items-end sm:gap-3">
      <form action={action} className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
        <input type="hidden" name="id" value={label.id} />
        <div className="min-w-0 flex-1 space-y-1">
          <Label htmlFor={`lb-name-${label.id}`} className="text-xs">
            Name
          </Label>
          <Input
            id={`lb-name-${label.id}`}
            name="name"
            defaultValue={label.name}
            maxLength={80}
            required
            className="h-8 text-sm"
          />
        </div>
        <div className="w-full space-y-1 sm:w-40">
          <Label htmlFor={`lb-color-${label.id}`} className="text-xs">
            Color
          </Label>
          <select
            id={`lb-color-${label.id}`}
            name="color"
            defaultValue={label.color}
            className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
          >
            {colorOptions.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" size="sm" variant="secondary" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
        {state.error ? (
          <p className="w-full text-xs text-destructive">{state.error}</p>
        ) : null}
      </form>
      <div className="flex shrink-0 items-center gap-2 sm:pb-0.5">
        <span
          className="size-3 rounded-full ring-1 ring-border/60"
          style={{ backgroundColor: label.color }}
          title="Current color"
        />
        <ConfirmDialog
          title="Delete this label?"
          description="It will be removed from all tasks that use it."
          confirmLabel="Delete label"
          confirmVariant="destructive"
          trigger={
            <button
              type="button"
              className="text-xs font-medium text-destructive hover:underline"
            >
              Delete
            </button>
          }
          onConfirm={async () => {
            const r = await deleteLabelBoardAction(label.id, projectId);
            if (r.error) throw new Error(r.error);
            router.refresh();
          }}
        />
      </div>
    </li>
  );
}

export function ManageLabelsTab({
  projectId,
  labels,
  newLabelFormKey,
  onLabelAdded,
}: {
  projectId: string;
  labels: SerializedProjectLabel[];
  newLabelFormKey: number;
  onLabelAdded?: () => void;
}) {
  return (
    <div className="space-y-6">
      {labels.length > 0 ? (
        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Edit labels
          </p>
          <ul className="space-y-2">
            {labels.map((lb) => (
              <LabelEditRow key={lb.id} label={lb} projectId={projectId} />
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No labels yet. Add one below.
        </p>
      )}
      <div className="border-t border-border/60 pt-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          New label
        </p>
        <NewLabelForm
          projectId={projectId}
          formKey={newLabelFormKey}
          onAdded={onLabelAdded}
        />
      </div>
    </div>
  );
}
