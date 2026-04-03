"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  createProjectStatusAction,
  deleteProjectStatusAction,
  moveProjectStatusAction,
  updateProjectStatusAction,
  type StatusActionState,
} from "@/app/(app)/projects/[id]/project-status-actions";
import type { SerializedStatus } from "@/app/(app)/projects/[id]/board/types";
import { ChevronDown, ChevronUp } from "lucide-react";

const initial: StatusActionState = {};

function MoveStatusButton({
  statusId,
  direction,
  label,
}: {
  statusId: string;
  direction: "up" | "down";
  label: string;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(
    moveProjectStatusAction,
    initial,
  );

  useEffect(() => {
    if (!state.ok) return;
    router.refresh();
  }, [state.ok, router]);

  return (
    <form action={action} className="inline">
      <input type="hidden" name="id" value={statusId} />
      <input type="hidden" name="direction" value={direction} />
      <Button
        type="submit"
        variant="ghost"
        size="icon-xs"
        disabled={pending}
        aria-label={label}
        className="size-7"
      >
        {direction === "up" ? (
          <ChevronUp className="size-4" />
        ) : (
          <ChevronDown className="size-4" />
        )}
      </Button>
    </form>
  );
}

function StatusNameUpdateForm({ status }: { status: SerializedStatus }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(
    updateProjectStatusAction,
    initial,
  );

  useEffect(() => {
    if (!state.ok) return;
    router.refresh();
  }, [state.ok, router]);

  return (
    <form
      action={action}
      className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end"
    >
      <input type="hidden" name="id" value={status.id} />
      <div className="min-w-0 flex-1 space-y-1">
        <Label htmlFor={`st-${status.id}`} className="sr-only">
          Column name
        </Label>
        <Input
          id={`st-${status.id}`}
          name="name"
          defaultValue={status.name}
          maxLength={80}
          required
          className="h-8 text-sm"
        />
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground sm:shrink-0">
        <input
          type="checkbox"
          name="isFinal"
          value="on"
          defaultChecked={status.isFinal}
          className="size-4 rounded border-input"
        />
        Final column
      </label>
      <Button type="submit" size="sm" variant="secondary" disabled={pending}>
        {pending ? "…" : "Save"}
      </Button>
      {state.error ? (
        <p className="w-full text-xs text-destructive">{state.error}</p>
      ) : null}
    </form>
  );
}

export function ManageBoardColumnsTab({
  projectId,
  statuses,
}: {
  projectId: string;
  statuses: SerializedStatus[];
}) {
  const router = useRouter();
  const sorted = [...statuses].sort((a, b) => a.sortOrder - b.sortOrder);
  const [createKey, setCreateKey] = useState(0);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createPending, startCreate] = useTransition();

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Columns (left → right on the board)
        </p>
        <ul className="space-y-2">
          {sorted.map((s) => (
            <li
              key={s.id}
              className="flex flex-col gap-2 rounded-lg border border-border/60 bg-muted/20 p-3 sm:flex-row sm:items-start sm:gap-3"
            >
              <div className="flex shrink-0 items-center gap-0.5 pt-0.5">
                <MoveStatusButton
                  statusId={s.id}
                  direction="up"
                  label="Move column up"
                />
                <MoveStatusButton
                  statusId={s.id}
                  direction="down"
                  label="Move column down"
                />
              </div>
              <StatusNameUpdateForm status={s} />
              <div className="flex shrink-0 items-start sm:pt-1">
                <ConfirmDialog
                  title="Remove this column?"
                  description="Only empty columns can be removed. You must keep at least one."
                  confirmLabel="Remove"
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
                    const r = await deleteProjectStatusAction(s.id, projectId);
                    if (r.error) throw new Error(r.error);
                    router.refresh();
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-border/60 pt-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Add column
        </p>
        <form
          key={createKey}
          className="flex flex-col gap-2 sm:flex-row sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            setCreateError(null);
            const fd = new FormData(e.currentTarget);
            startCreate(async () => {
              const r = await createProjectStatusAction(null, fd);
              if (r.error) {
                setCreateError(r.error);
                return;
              }
              setCreateKey((k) => k + 1);
              router.refresh();
            });
          }}
        >
          <input type="hidden" name="projectId" value={projectId} />
          <div className="min-w-0 flex-1 space-y-1">
            <Label htmlFor="new-col-name">Name</Label>
            <Input
              id="new-col-name"
              name="name"
              placeholder="e.g. Review"
              maxLength={80}
              required
              className="h-8"
            />
          </div>
          <Button type="submit" size="sm" disabled={createPending}>
            {createPending ? "Adding…" : "Add column"}
          </Button>
        </form>
        {createError ? (
          <p className="mt-2 text-sm text-destructive">{createError}</p>
        ) : null}
      </div>
    </div>
  );
}
