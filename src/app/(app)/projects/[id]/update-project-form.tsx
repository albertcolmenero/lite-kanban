"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  updateProjectAction,
  type ActionState,
} from "@/app/(app)/projects/actions";
import { PROJECT_COLOR_PALETTE } from "@/lib/projects/project-color";
import { cn } from "@/lib/utils";

const initial: ActionState = {};

type Props = {
  projectId: string;
  name: string;
  description: string | null;
  color: string | null;
  onSaved?: () => void;
};

export function UpdateProjectForm({
  projectId,
  name,
  description,
  color,
  onSaved,
}: Props) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    updateProjectAction,
    initial,
  );
  const [colorHex, setColorHex] = useState(() => color ?? "");

  useEffect(() => {
    if (!state.ok) return;
    router.refresh();
    onSaved?.();
  }, [state.ok, onSaved, router]);

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-3">
      <input type="hidden" name="id" value={projectId} />
      <input type="hidden" name="color" value={colorHex} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="edit-name" className="text-sm font-medium">
          Name
        </label>
        <Input
          id="edit-name"
          name="name"
          required
          maxLength={120}
          defaultValue={name}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="edit-description" className="text-sm font-medium">
          Description
        </label>
        <Textarea
          id="edit-description"
          name="description"
          maxLength={2000}
          rows={3}
          defaultValue={description ?? ""}
        />
      </div>
      <div className="flex flex-col gap-2">
        <span id="edit-color-label" className="text-sm font-medium">
          Project color
        </span>
        <p className="text-xs text-muted-foreground">
          Used as a subtle tint on this board, project cards, and inbox when
          grouped by project (shown at 20% opacity).
        </p>
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-labelledby="edit-color-label"
        >
          {PROJECT_COLOR_PALETTE.map((hex) => {
            const selected = colorHex === hex;
            return (
              <button
                key={hex}
                type="button"
                onClick={() => setColorHex(hex)}
                className={cn(
                  "size-8 shrink-0 rounded-md border-2 transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  selected
                    ? "border-foreground shadow-sm ring-2 ring-ring ring-offset-2 ring-offset-background"
                    : "border-border/60 hover:border-foreground/40",
                )}
                style={{ backgroundColor: hex }}
                aria-label={`Set project color ${hex}`}
                aria-pressed={selected}
              />
            );
          })}
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="w-fit"
          onClick={() => setColorHex("")}
        >
          Clear color
        </Button>
      </div>
      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
