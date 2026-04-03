"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { COLUMN_PREFIX } from "@/lib/board/constants";
import { moveTaskAction } from "@/app/(app)/projects/[id]/board-actions";
import type {
  SerializedBoardTask,
  SerializedStatus,
} from "@/app/(app)/projects/[id]/board/types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

function colId(statusId: string) {
  return `${COLUMN_PREFIX}${statusId}`;
}

function SortableCard({
  task,
  onOpen,
}: {
  task: SerializedBoardTask;
  onOpen: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      size="sm"
      className={`p-3 ${isDragging ? "opacity-40" : ""}`}
    >
      <div className="flex gap-2">
        <button
          type="button"
          className="mt-0.5 cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
          {...attributes}
          {...listeners}
          aria-label="Drag to move"
        >
          ⋮⋮
        </button>
        <button
          type="button"
          className="min-w-0 flex-1 text-left"
          onClick={() => onOpen(task.id)}
        >
          <p className="font-medium leading-snug">{task.name}</p>
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        <Badge variant="secondary" className="text-[0.65rem] font-normal">
          {task.priority.name}
        </Badge>
        {task.labels.map(({ label }) => (
          <Badge
            key={label.id}
            variant="outline"
            className="text-[0.65rem] font-normal"
            style={{ borderColor: label.color, color: label.color }}
          >
            {label.name}
          </Badge>
        ))}
      </div>
    </Card>
  );
}

function ColumnDrop({
  status,
  tasks,
  onOpen,
}: {
  status: SerializedStatus;
  tasks: SerializedBoardTask[];
  onOpen: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: colId(status.id) });
  const ids = tasks.map((t) => t.id);

  return (
    <div
      ref={setNodeRef}
      className={`flex w-[min(100%,280px)] shrink-0 flex-col rounded-xl bg-muted/40 m-2 p-4 ring-1 ring-border/60 ${isOver ? "ring-2 ring-primary/40" : ""}`}
    >
      <div className="mb-2 flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold">{status.name}</h3>
        <span className="text-xs tabular-nums text-muted-foreground">
          {tasks.length}
        </span>
      </div>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="flex min-h-[120px] flex-col gap-2">
          {tasks.map((t) => (
            <SortableCard key={t.id} task={t} onOpen={onOpen} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

export function KanbanBoard({
  projectId,
  statuses,
  tasks,
  onOpenTask,
}: {
  projectId: string;
  statuses: SerializedStatus[];
  tasks: SerializedBoardTask[];
  onOpenTask: (id: string) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [activeId, setActiveId] = useState<string | null>(null);

  const byStatus = useMemo(() => {
    const m = new Map<string, SerializedBoardTask[]>();
    for (const s of statuses) m.set(s.id, []);
    for (const t of tasks) {
      const arr = m.get(t.statusId);
      if (arr) arr.push(t);
    }
    for (const arr of m.values()) {
      arr.sort((a, b) => a.position - b.position);
    }
    return m;
  }, [tasks, statuses]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const activeTask = activeId
    ? tasks.find((t) => t.id === activeId)
    : undefined;

  function resolveDrop(
    overId: string,
  ): { statusId: string; index: number } | null {
    if (overId.startsWith(COLUMN_PREFIX)) {
      const statusId = overId.slice(COLUMN_PREFIX.length);
      const col = byStatus.get(statusId) ?? [];
      return { statusId, index: col.length };
    }
    const overTask = tasks.find((t) => t.id === overId);
    if (!overTask) return null;
    const col = byStatus.get(overTask.statusId) ?? [];
    const index = col.findIndex((t) => t.id === overId);
    return {
      statusId: overTask.statusId,
      index: index >= 0 ? index : col.length,
    };
  }

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;

    const taskId = String(active.id);
    if (taskId.startsWith(COLUMN_PREFIX)) return;

    const drop = resolveDrop(String(over.id));
    if (!drop) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const fromCol = byStatus.get(task.statusId) ?? [];
    const fromIndex = fromCol.findIndex((t) => t.id === taskId);

    let targetIndex = drop.index;
    if (
      task.statusId === drop.statusId &&
      fromIndex >= 0 &&
      fromIndex < drop.index
    ) {
      targetIndex = drop.index - 1;
    }
    if (task.statusId === drop.statusId && fromIndex === targetIndex) return;

    startTransition(async () => {
      await moveTaskAction(projectId, taskId, drop.statusId, targetIndex);
      router.refresh();
    });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-4">
        {statuses.map((s) => (
          <ColumnDrop
            key={s.id}
            status={s}
            tasks={byStatus.get(s.id) ?? []}
            onOpen={onOpenTask}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? (
          <Card size="sm" className="w-[260px] p-3 shadow-lg">
            <p className="font-medium">{activeTask.name}</p>
          </Card>
        ) : null}
      </DragOverlay>
      {pending ? (
        <p className="text-xs text-muted-foreground">Updating board…</p>
      ) : null}
    </DndContext>
  );
}
