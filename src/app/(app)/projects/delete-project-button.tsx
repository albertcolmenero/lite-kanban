"use client";

import { useRouter } from "next/navigation";
import { deleteProjectAction } from "@/app/(app)/projects/actions";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function DeleteProjectButton({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
  const router = useRouter();

  return (
    <ConfirmDialog
      title="Delete this project?"
      description={
        <>
          Everything in{" "}
          <strong className="text-foreground">{projectName}</strong> will be
          permanently deleted, including tasks, comments, and attachments.
        </>
      }
      confirmLabel="Delete project"
      cancelLabel="Cancel"
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
        const result = await deleteProjectAction(projectId);
        if (result.error) throw new Error(result.error);
        router.refresh();
      }}
    />
  );
}
