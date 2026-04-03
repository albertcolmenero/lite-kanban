"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  updateProjectAction,
  type ActionState,
} from "@/app/(app)/projects/actions";

const initial: ActionState = {};

type Props = {
  projectId: string;
  name: string;
  description: string | null;
  onSaved?: () => void;
};

export function UpdateProjectForm({
  projectId,
  name,
  description,
  onSaved,
}: Props) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    updateProjectAction,
    initial,
  );

  useEffect(() => {
    if (!state.ok) return;
    router.refresh();
    onSaved?.();
  }, [state.ok, onSaved, router]);

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-3">
      <input type="hidden" name="id" value={projectId} />
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
