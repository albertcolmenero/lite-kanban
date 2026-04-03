"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LABEL_COLOR_OPTIONS } from "@/lib/board/constants";
import { createLabelBoardAction, type BoardActionState } from "@/app/(app)/projects/[id]/board-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function NewLabelForm({
  projectId,
  formKey = 0,
  onAdded,
}: {
  projectId: string;
  formKey?: number;
  onAdded?: () => void;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(
    createLabelBoardAction,
    {} as BoardActionState,
  );

  useEffect(() => {
    if (!state.ok) return;
    router.refresh();
    onAdded?.();
  }, [state.ok, onAdded, router]);

  return (
    <form
      key={formKey}
      action={action}
      className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end"
    >
      <input type="hidden" name="projectId" value={projectId} />
      <div className="flex flex-col gap-1">
        <Label htmlFor="ln">New label</Label>
        <Input
          id="ln"
          name="name"
          placeholder="Name"
          maxLength={80}
          required
          className="w-40"
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="lc">Color</Label>
        <select
          id="lc"
          name="color"
          className="h-8 rounded-md border border-input bg-background px-2 text-sm"
          defaultValue={LABEL_COLOR_OPTIONS[0].value}
        >
          {LABEL_COLOR_OPTIONS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        Add label
      </Button>
      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
    </form>
  );
}
