"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { SerializedBoardTask } from "@/app/(app)/projects/[id]/board/types";

export function TaskListBoard({
  projectNamesById,
  tasks,
  onOpenTask,
}: {
  projectNamesById: Record<string, string>;
  tasks: SerializedBoardTask[];
  onOpenTask: (id: string) => void;
}) {
  const sorted = [...tasks].sort((a, b) => {
    const pa = a.priority.sortOrder;
    const pb = b.priority.sortOrder;
    if (pa !== pb) return pb - pa;
    return a.position - b.position;
  });

  return (
    <div className="flex flex-col gap-2">
      {sorted.map((t) => (
        <Card
          key={t.id}
          size="sm"
          className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:gap-4"
        >
          <button
            type="button"
            className="min-w-0 flex-1 text-left font-medium hover:underline sm:min-w-48"
            onClick={() => onOpenTask(t.id)}
          >
            {t.name}
          </button>
          <p className="shrink-0 text-sm text-muted-foreground sm:w-40 sm:text-right">
            {projectNamesById[t.projectId] ?? "—"}
          </p>
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:justify-end">
            {t.labels.length === 0 ? (
              <span className="text-sm text-muted-foreground">—</span>
            ) : (
              t.labels.map(({ label }) => (
                <Badge
                  key={label.id}
                  variant="outline"
                  className="font-normal"
                  style={{ borderColor: label.color, color: label.color }}
                >
                  {label.name}
                </Badge>
              ))
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
