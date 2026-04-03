"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type {
  SerializedBoardTask,
  SerializedStatus,
} from "@/app/(app)/projects/[id]/board/types";

export function TaskListBoard({
  statuses,
  tasks,
  onOpenTask,
}: {
  statuses: SerializedStatus[];
  tasks: SerializedBoardTask[];
  onOpenTask: (id: string) => void;
}) {
  const order = new Map(statuses.map((s, i) => [s.id, i]));
  const sorted = [...tasks].sort((a, b) => {
    const da = order.get(a.statusId) ?? 99;
    const db = order.get(b.statusId) ?? 99;
    if (da !== db) return da - db;
    return a.position - b.position;
  });

  return (
    <div className="flex flex-col gap-2">
      {sorted.map((t) => (
        <Card
          key={t.id}
          size="sm"
          className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <button
            type="button"
            className="min-w-0 text-left font-medium hover:underline"
            onClick={() => onOpenTask(t.id)}
          >
            {t.name}
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="font-normal">
              {t.status.name}
            </Badge>
            <Badge variant="secondary" className="font-normal">
              {t.priority.name}
            </Badge>
            {t.labels.map(({ label }) => (
              <Badge
                key={label.id}
                variant="outline"
                className="font-normal"
                style={{ borderColor: label.color, color: label.color }}
              >
                {label.name}
              </Badge>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
