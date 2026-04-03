"use client";

import { useCallback, useState } from "react";
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
import { cn } from "@/lib/utils";

export type ConfirmDialogProps = {
  /** Element that opens the dialog (e.g. `<button type="button">…</button>` or `<Button />`). */
  trigger: React.ReactElement;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "default" | "destructive";
  /** Runs when the user confirms; throw or reject to keep the dialog open and show the message. */
  onConfirm: () => void | Promise<void>;
  contentClassName?: string;
};

export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "default",
  onConfirm,
  contentClassName,
}: ConfirmDialogProps) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = useCallback(async () => {
    setError(null);
    setPending(true);
    try {
      await onConfirm();
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setPending(false);
    }
  }, [onConfirm]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setError(null);
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent
        showCloseButton={false}
        className={cn("sm:max-w-md", contentClassName)}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {typeof description === "string" ? (
            <DialogDescription>{description}</DialogDescription>
          ) : description != null ? (
            <div className="text-sm text-muted-foreground *:[strong]:font-medium *:[strong]:text-foreground">
              {description}
            </div>
          ) : null}
        </DialogHeader>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <DialogFooter className="gap-2 border-0 bg-transparent p-0 sm:justify-end">
          <DialogClose
            render={<Button type="button" variant="outline" disabled={pending} />}
          >
            {cancelLabel}
          </DialogClose>
          <Button
            type="button"
            variant={confirmVariant}
            disabled={pending}
            onClick={() => void handleConfirm()}
          >
            {pending ? "Please wait…" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
