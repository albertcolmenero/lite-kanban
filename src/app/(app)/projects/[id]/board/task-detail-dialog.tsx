"use client";

import {
  useActionState,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import {
  addCommentAction,
  addSubtaskAction,
  createLabelInlineAction,
  deleteTaskBoardAction,
  toggleSubtaskAction,
  type BoardActionState,
  updateTaskBoardAction,
  uploadTaskAttachmentAction,
} from "@/app/(app)/projects/[id]/board-actions";
import type {
  SerializedBoardTask,
  SerializedProjectLabel,
  SerializedPriority,
  SerializedStatus,
} from "@/app/(app)/projects/[id]/board/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { dueDateIsoToInputValue } from "@/lib/tasks/due-date";
import { SearchableMultiSelect } from "@/components/ui/searchable-multi-select";

function formatActivityType(t: string) {
  return t.replace(/_/g, " ");
}

function TaskDetailPanel({
  task,
  projectId,
  projectLabels,
  priorities,
  statuses: statusesProp,
  onOpenChange,
}: {
  task: SerializedBoardTask;
  projectId: string;
  projectLabels: SerializedProjectLabel[];
  priorities: SerializedPriority[];
  statuses?: SerializedStatus[];
  onOpenChange: (v: boolean) => void;
}) {
  const statuses = statusesProp ?? [];
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [labelSet, setLabelSet] = useState(
    () => new Set(task.labels.map((l) => l.label.id)),
  );
  const [extraLabels, setExtraLabels] = useState<SerializedProjectLabel[]>([]);
  const [labelsEditorOpen, setLabelsEditorOpen] = useState(false);

  useEffect(() => {
    setExtraLabels((prev) =>
      prev.filter((e) => !projectLabels.some((l) => l.id === e.id)),
    );
  }, [projectLabels]);

  useEffect(() => {
    setExtraLabels([]);
    setLabelsEditorOpen(false);
  }, [task.id]);

  const taskLabelIdsKey = useMemo(
    () =>
      [...task.labels.map((l) => l.label.id)].sort().join("\0"),
    [task.labels],
  );

  useEffect(() => {
    setLabelSet(new Set(task.labels.map((l) => l.label.id)));
  }, [task.id, taskLabelIdsKey]);

  const [updState, updAction, updPending] = useActionState(
    updateTaskBoardAction,
    {} as BoardActionState,
  );
  const [comState, comAction, comPending] = useActionState(
    addCommentAction,
    {} as BoardActionState,
  );
  const [subState, subAction, subPending] = useActionState(
    addSubtaskAction,
    {} as BoardActionState,
  );

  useEffect(() => {
    if (updState.ok || comState.ok || subState.ok) router.refresh();
  }, [updState.ok, comState.ok, subState.ok, router]);

  const labelIdsValue = useMemo(() => [...labelSet].join(","), [labelSet]);

  const mergedProjectLabels = useMemo(() => {
    const seen = new Set<string>();
    const out: SerializedProjectLabel[] = [];
    for (const lb of projectLabels) {
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
  }, [projectLabels, extraLabels]);

  const labelOptions = useMemo(
    () =>
      mergedProjectLabels.map((lb) => ({
        value: lb.id,
        label: lb.name,
        color: lb.color,
      })),
    [mergedProjectLabels],
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
    <div className="flex min-h-0 w-full flex-1 flex-col">
      
      <ScrollArea className="min-h-0 flex-1 pr-1">
        <div className="space-y-4 pr-4">
          <form action={updAction} className="space-y-3">
            <input type="hidden" name="id" value={task.id} />
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="labelIds" value={labelIdsValue} />
            <div className="space-y-1.5">
              <Label htmlFor="tname">Name</Label>
              <Input
                id="tname"
                name="name"
                defaultValue={task.name}
                required
                maxLength={200}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tdesc">Description</Label>
              <Textarea
                id="tdesc"
                name="description"
                rows={4}
                maxLength={5000}
                defaultValue={task.description ?? ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tdued">Due date</Label>
              <Input
                id="tdued"
                name="dueDate"
                type="date"
                defaultValue={dueDateIsoToInputValue(task.dueDate)}
                className="w-full"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tst">Column</Label>
              <select
                id="tst"
                name="statusId"
                defaultValue={task.statusId}
                className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
              >
                {statuses.length > 0
                  ? statuses.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                        {s.isFinal ? " (final)" : ""}
                      </option>
                    ))
                  : (
                      <option value={task.statusId}>{task.status.name}</option>
                    )}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tpr">Priority</Label>
              <select
                id="tpr"
                name="priorityId"
                defaultValue={task.priorityId}
                className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
              >
                {priorities.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-detail-labels">Labels</Label>
              {!labelsEditorOpen ? (
                <button
                  type="button"
                  id="task-detail-labels"
                  className="flex w-full min-h-10 items-start justify-between gap-3 rounded-lg border border-input bg-transparent px-2.5 py-2 text-left text-sm transition-colors hover:bg-muted/40"
                  onClick={() => setLabelsEditorOpen(true)}
                >
                  <div className="flex min-w-0 flex-1 flex-wrap gap-1">
                    {labelSet.size === 0 ? (
                      <span className="text-muted-foreground">
                        No labels — click to add or search
                      </span>
                    ) : (
                      mergedProjectLabels
                        .filter((lb) => labelSet.has(lb.id))
                        .map((lb) => (
                          <Badge
                            key={lb.id}
                            variant="outline"
                            className="font-normal"
                            style={{ borderColor: lb.color, color: lb.color }}
                          >
                            {lb.name}
                          </Badge>
                        ))
                    )}
                  </div>
                  <span className="shrink-0 pt-0.5 text-xs text-muted-foreground">
                    Edit
                  </span>
                </button>
              ) : (
                <div className="space-y-2">
                  <SearchableMultiSelect
                    id="task-detail-labels"
                    variant="popover"
                    options={labelOptions}
                    value={[...labelSet]}
                    onValueChange={(ids) => setLabelSet(new Set(ids))}
                    placeholder="Search or type to add a label…"
                    searchPlaceholder="Add more…"
                    emptyText={
                      mergedProjectLabels.length === 0
                        ? "Type a name and pick Create to add your first label"
                        : "No labels match"
                    }
                    onCreateOption={onCreateLabel}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setLabelsEditorOpen(false)}
                  >
                    Done
                  </Button>
                </div>
              )}
            </div>
            {updState.error ? (
              <p className="text-sm text-destructive">{updState.error}</p>
            ) : null}
            <Button type="submit" size="sm" disabled={updPending}>
              {updPending ? "Saving…" : "Save changes"}
            </Button>
          </form>

          <Separator />

          <div>
            <h4 className="mb-2 text-sm font-medium">Subtasks</h4>
            <ul className="mb-3 space-y-2">
              {task.subtasks.map((s) => (
                <li key={s.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="size-4 rounded border-input"
                    checked={s.completed}
                    onChange={(e) => {
                      startTransition(async () => {
                        await toggleSubtaskAction(
                          s.id,
                          e.target.checked,
                          projectId,
                        );
                        router.refresh();
                      });
                    }}
                  />
                  <span
                    className={
                      s.completed ? "text-muted-foreground line-through" : ""
                    }
                  >
                    {s.title}
                  </span>
                </li>
              ))}
            </ul>
            <form action={subAction} className="flex gap-2">
              <input type="hidden" name="taskId" value={task.id} />
              <input type="hidden" name="projectId" value={projectId} />
              <Input
                name="title"
                placeholder="New subtask"
                maxLength={300}
                className="flex-1"
                required
              />
              <Button type="submit" size="sm" disabled={subPending}>
                Add
              </Button>
            </form>
            {subState.error ? (
              <p className="mt-1 text-sm text-destructive">{subState.error}</p>
            ) : null}
          </div>

          <Separator />

          <div>
            <h4 className="mb-2 text-sm font-medium">Attachments</h4>
            <ul className="mb-2 space-y-1 text-sm">
              {task.attachments.map((a) => (
                <li key={a.id}>
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline"
                  >
                    {a.filename || "File"}
                  </a>
                </li>
              ))}
            </ul>
            <form
              action={uploadTaskAttachmentAction}
              encType="multipart/form-data"
              className="flex flex-col gap-2 sm:flex-row sm:items-center"
            >
              <input type="hidden" name="taskId" value={task.id} />
              <input type="hidden" name="projectId" value={projectId} />
              <Input type="file" name="file" required className="text-sm" />
              <Button type="submit" size="sm" variant="secondary">
                Upload
              </Button>
            </form>
          </div>

          <Separator />

          <div>
            <h4 className="mb-2 text-sm font-medium">Comments</h4>
            <ul className="mb-3 max-h-40 space-y-2 overflow-y-auto text-sm">
              {task.comments.map((c) => (
                <li key={c.id} className="rounded-md bg-muted/50 p-2">
                  <p className="whitespace-pre-wrap">{c.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(c.createdAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
            <form action={comAction} className="space-y-2">
              <input type="hidden" name="taskId" value={task.id} />
              <input type="hidden" name="projectId" value={projectId} />
              <Textarea
                name="body"
                placeholder="Write a comment…"
                rows={3}
                maxLength={8000}
                required
              />
              <Button type="submit" size="sm" disabled={comPending}>
                {comPending ? "Posting…" : "Comment"}
              </Button>
            </form>
            {comState.error ? (
              <p className="text-sm text-destructive">{comState.error}</p>
            ) : null}
          </div>

          <Separator />

          <div>
            <h4 className="mb-2 text-sm font-medium">Activity</h4>
            {task.activities.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {task.activities.map((a) => (
                  <li
                    key={a.id}
                    className="rounded-md border border-border/60 p-2"
                  >
                    <p className="font-medium capitalize">
                      {formatActivityType(a.type)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(a.createdAt).toLocaleString()}
                    </p>
                    {a.metadata != null ? (
                      <pre className="mt-1 max-h-24 overflow-auto text-xs text-muted-foreground">
                        {JSON.stringify(a.metadata, null, 2)}
                      </pre>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="w-full"
            onClick={() => {
              startTransition(async () => {
                await deleteTaskBoardAction(projectId, task.id);
                onOpenChange(false);
                router.refresh();
              });
            }}
          >
            Delete task
          </Button>
        </div>
      </ScrollArea>
    </div>
  );
}

export function TaskDetailDialog({
  task,
  open,
  onOpenChange,
  projectId,
  projectLabels,
  priorities,
  statuses,
}: {
  task: SerializedBoardTask | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  projectId: string;
  projectLabels: SerializedProjectLabel[];
  priorities: SerializedPriority[];
  statuses?: SerializedStatus[];
}) {
  if (!task) return null;

  const handleDetailOpenChange = useCallback(
    (v: boolean) => {
      // #region agent log
      fetch("http://127.0.0.1:7799/ingest/d0877993-cce7-4746-af40-c3c53f505f88", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "3c39b6",
        },
        body: JSON.stringify({
          sessionId: "3c39b6",
          runId: "pre-fix",
          hypothesisId: "H3",
          location: "task-detail-dialog.tsx:onOpenChange",
          message: "TaskDetailDialog onOpenChange",
          data: { nextOpen: v, taskId: task.id },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      onOpenChange(v);
    },
    [onOpenChange, task.id],
  );

  return (
    <Dialog open={open} onOpenChange={handleDetailOpenChange}>
      <DialogContent className="flex max-h-[min(92vh,760px)] min-h-0 flex-col gap-4 overflow-hidden p-6 pb-6 sm:max-w-lg">
        <TaskDetailPanel
          key={task.id}
          task={task}
          projectId={projectId}
          projectLabels={projectLabels}
          priorities={priorities}
          statuses={statuses ?? []}
          onOpenChange={onOpenChange}
        />
      </DialogContent>
    </Dialog>
  );
}
