"use client";

import { useActionState, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createProjectAction,
  type ActionState,
} from "@/app/(app)/projects/actions";

const initial: ActionState = {};

function CreateProjectFormBody({ onSuccess }: { onSuccess: () => void }) {
  const [state, formAction, pending] = useActionState(
    createProjectAction,
    initial,
  );

  useEffect(() => {
    if (!state.ok) return;
    onSuccess();
  }, [state.ok, onSuccess]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="project-name">Name</Label>
        <Input
          id="project-name"
          name="name"
          required
          maxLength={120}
          placeholder="e.g. Website redesign"
          autoComplete="off"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="project-description">
          Description{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="project-description"
          name="description"
          maxLength={2000}
          rows={3}
          placeholder="Short summary…"
        />
      </div>
      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      <DialogFooter className="gap-2 border-0 bg-transparent p-0 sm:justify-end">
        <DialogClose render={<Button type="button" variant="outline" />}>
          Cancel
        </DialogClose>
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create project"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function CreateProjectDialog() {
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const onSuccess = useCallback(() => setOpen(false), []);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setFormKey((k) => k + 1);
      }}
    >
      <DialogTrigger render={<Button>New project</Button>} />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New project</DialogTitle>
          <DialogDescription>
            Projects start with default statuses (Open, Idea, In progress) and
            priorities (Low, Medium, High).
          </DialogDescription>
        </DialogHeader>
        <CreateProjectFormBody key={formKey} onSuccess={onSuccess} />
      </DialogContent>
    </Dialog>
  );
}
