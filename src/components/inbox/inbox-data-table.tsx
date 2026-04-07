"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Filter,
  GripVertical,
  Layers,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { saveInboxPreferencesAction } from "@/app/(app)/inbox/inbox-preferences-actions";
import type { SerializedBoardTask } from "@/app/(app)/projects/[id]/board/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { filterAndSortInboxTable } from "@/lib/inbox/inbox-table-filters";
import type {
  InboxColumnId,
  InboxDueFilter,
  InboxTableFilters,
  InboxTableSort,
} from "@/lib/inbox/inbox-table-types";
import {
  DEFAULT_INBOX_COLUMN_ORDER,
  defaultInboxTableFilters,
} from "@/lib/inbox/inbox-table-types";
import { groupInboxTasksByColumn } from "@/lib/inbox/group-inbox-tasks";
import type { InboxPreferencesPersistedV1 } from "@/lib/inbox/inbox-preferences-schema";
import { formatDueDateShort } from "@/lib/tasks/due-date";
import { inboxDueBucket } from "@/lib/tasks/sort-inbox-tasks";
import {
  PROJECT_TINT_ALPHA,
  projectColorToRgba,
} from "@/lib/projects/project-color";
import { cn } from "@/lib/utils";

const COLUMN_LABELS: Record<InboxColumnId, string> = {
  name: "Task name",
  project: "Project",
  dueDate: "Due date",
  priority: "Priority",
  labels: "Labels",
  status: "Column",
};

function legacyColumnOrderStorageKey(scope: string) {
  return `lite-trello:inboxColumnOrder:v1:${scope}`;
}

function isValidColumnOrder(order: unknown): order is InboxColumnId[] {
  if (!Array.isArray(order) || order.length !== DEFAULT_INBOX_COLUMN_ORDER.length)
    return false;
  const set = new Set(order);
  for (const id of DEFAULT_INBOX_COLUMN_ORDER) {
    if (!set.has(id)) return false;
  }
  return true;
}

function columnHasActiveFilter(
  column: InboxColumnId,
  filters: InboxTableFilters,
): boolean {
  switch (column) {
    case "name":
      return filters.nameQuery.trim().length > 0;
    case "project":
      return filters.projectIds.length > 0;
    case "dueDate":
      return filters.due !== "all";
    case "priority":
      return filters.priorityIds.length > 0;
    case "labels":
      return filters.labelIds.length > 0;
    case "status":
      return filters.statusIds.length > 0;
    default:
      return false;
  }
}

function SortableTh({
  column,
  label,
  sort,
  onSort,
  onOpenFilter,
  filterActive,
  groupByColumn,
}: {
  column: InboxColumnId;
  label: string;
  sort: InboxTableSort;
  onSort: () => void;
  onOpenFilter: () => void;
  filterActive: boolean;
  groupByColumn: InboxColumnId | null;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  };

  const sortIcon =
    sort?.column === column ? (
      sort.direction === "asc" ? (
        <ArrowUp className="size-3.5 shrink-0" aria-hidden />
      ) : (
        <ArrowDown className="size-3.5 shrink-0" aria-hidden />
      )
    ) : (
      <ArrowUpDown className="size-3.5 shrink-0 opacity-40" aria-hidden />
    );

  const isGroup = groupByColumn === column;

  return (
    <th
      ref={setNodeRef}
      style={style}
      className="border-b border-border/80 bg-muted/30 px-2 py-2 text-left text-xs font-medium text-muted-foreground"
    >
      <div className="flex min-w-0 items-center gap-0.5">
        <button
          type="button"
          className="touch-none rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label={`Reorder ${label} column`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-3.5" aria-hidden />
        </button>
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-1 rounded px-1 py-0.5 text-left font-medium text-foreground hover:bg-muted/80"
          onClick={onSort}
        >
          {isGroup ? (
            <Layers
              className="size-3.5 shrink-0 text-primary"
              aria-label="Grouping active"
            />
          ) : null}
          <span className="truncate">{label}</span>
          {sortIcon}
        </button>
        <span className="relative inline-flex shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-7 shrink-0"
            aria-label={`Filter ${label}`}
            onClick={onOpenFilter}
          >
            <Filter className="size-3.5" aria-hidden />
          </Button>
          {filterActive ? (
            <span className="absolute right-1 top-1 size-1.5 rounded-full bg-primary" />
          ) : null}
        </span>
      </div>
    </th>
  );
}

function renderCell(
  column: InboxColumnId,
  task: SerializedBoardTask,
  projectNamesById: Record<string, string>,
  now: Date,
) {
  switch (column) {
    case "name":
      return (
        <span className="font-medium text-foreground">{task.name}</span>
      );
    case "project":
      return (
        <Link
          href={`/projects/${task.projectId}`}
          onClick={(e) => e.stopPropagation()}
          className="text-muted-foreground hover:text-foreground hover:underline"
        >
          {projectNamesById[task.projectId] ?? "—"}
        </Link>
      );
    case "dueDate": {
      const formatted = formatDueDateShort(task.dueDate);
      const overdue = inboxDueBucket(task.dueDate, now) === 0;
      return (
        <span
          className={cn(
            "tabular-nums",
            overdue ? "font-medium text-destructive" : "text-muted-foreground",
          )}
        >
          {formatted ?? "—"}
        </span>
      );
    }
    case "priority":
      return (
        <span className="text-muted-foreground">{task.priority.name}</span>
      );
    case "labels":
      return task.labels.length === 0 ? (
        <span className="text-muted-foreground">—</span>
      ) : (
        <div className="flex flex-wrap gap-1">
          {task.labels.map(({ label }) => (
            <span
              key={label.id}
              className="inline-flex max-w-full truncate rounded border px-1.5 py-0.5 text-[0.65rem] font-normal"
              style={{ borderColor: label.color, color: label.color }}
            >
              {label.name}
            </span>
          ))}
        </div>
      );
    case "status":
      return (
        <span className="text-muted-foreground">{task.status.name}</span>
      );
    default:
      return null;
  }
}

export function InboxDataTable({
  projectNamesById,
  projectColorsById = {},
  tasks,
  onOpenTask,
  preferencesScope,
  initialPreferences,
  preferencesFromDb,
}: {
  projectNamesById: Record<string, string>;
  /** Optional project tint when grouping by project (project id → hex or null). */
  projectColorsById?: Record<string, string | null>;
  tasks: SerializedBoardTask[];
  onOpenTask: (id: string) => void;
  /** Matches `UserInboxPreferences.scope` (e.g. projects-overview or project:id). */
  preferencesScope: string;
  initialPreferences: InboxPreferencesPersistedV1;
  preferencesFromDb: boolean;
}) {
  const [columnOrder, setColumnOrder] = useState<InboxColumnId[]>(
    initialPreferences.columnOrder,
  );
  const [filters, setFilters] = useState<InboxTableFilters>(
    initialPreferences.filters,
  );
  const [sort, setSort] = useState<InboxTableSort>(initialPreferences.sort);
  const [groupByColumn, setGroupByColumn] = useState<InboxColumnId | null>(
    initialPreferences.groupByColumn,
  );
  const [filterColumn, setFilterColumn] = useState<InboxColumnId | null>(null);

  const skipNextSave = useRef(true);
  const legacyMerged = useRef(false);

  /** One-time: migrate column order from localStorage when the user had no DB row yet. */
  useEffect(() => {
    if (preferencesFromDb || legacyMerged.current) return;
    legacyMerged.current = true;
    try {
      const raw = localStorage.getItem(legacyColumnOrderStorageKey(preferencesScope));
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (!isValidColumnOrder(parsed)) return;
      const scope = preferencesScope;
      const filtersSnap = initialPreferences.filters;
      const sortSnap = initialPreferences.sort;
      const groupSnap = initialPreferences.groupByColumn;
      setTimeout(() => {
        setColumnOrder(parsed);
        void saveInboxPreferencesAction(scope, {
          version: 1,
          columnOrder: parsed,
          filters: filtersSnap,
          sort: sortSnap,
          groupByColumn: groupSnap,
        });
        try {
          localStorage.removeItem(legacyColumnOrderStorageKey(scope));
        } catch {
          /* ignore */
        }
      }, 0);
    } catch {
      /* ignore */
    }
  }, [
    preferencesFromDb,
    preferencesScope,
    initialPreferences.filters,
    initialPreferences.sort,
    initialPreferences.groupByColumn,
  ]);

  const persisted = useMemo<InboxPreferencesPersistedV1>(
    () => ({
      version: 1,
      columnOrder,
      filters,
      sort,
      groupByColumn,
    }),
    [columnOrder, filters, sort, groupByColumn],
  );

  useEffect(() => {
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    const t = setTimeout(() => {
      void saveInboxPreferencesAction(preferencesScope, persisted);
    }, 500);
    return () => clearTimeout(t);
  }, [persisted, preferencesScope]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = useCallback((e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setColumnOrder((order) => {
      const oldIndex = order.indexOf(active.id as InboxColumnId);
      const newIndex = order.indexOf(over.id as InboxColumnId);
      if (oldIndex < 0 || newIndex < 0) return order;
      return arrayMove(order, oldIndex, newIndex);
    });
  }, []);

  const cycleSort = useCallback((column: InboxColumnId) => {
    setSort((prev) => {
      if (prev?.column !== column) return { column, direction: "asc" };
      if (prev.direction === "asc") return { column, direction: "desc" };
      return null;
    });
  }, []);

  const now = useMemo(() => new Date(), []);

  const rows = useMemo(
    () => filterAndSortInboxTable(tasks, filters, sort, projectNamesById, now),
    [tasks, filters, sort, projectNamesById, now],
  );

  const grouped = useMemo(() => {
    if (!groupByColumn) return null;
    return groupInboxTasksByColumn(
      rows,
      groupByColumn,
      projectNamesById,
      now,
    );
  }, [rows, groupByColumn, projectNamesById, now]);

  const uniqueProjects = useMemo(() => {
    const m = new Map<string, string>();
    for (const t of tasks) {
      const name = projectNamesById[t.projectId];
      if (name) m.set(t.projectId, name);
    }
    return [...m.entries()].sort((a, b) =>
      a[1].localeCompare(b[1], undefined, { sensitivity: "base" }),
    );
  }, [tasks, projectNamesById]);

  const uniquePriorities = useMemo(() => {
    const m = new Map<string, string>();
    for (const t of tasks) {
      m.set(t.priority.id, t.priority.name);
    }
    return [...m.entries()].sort((a, b) =>
      a[1].localeCompare(b[1], undefined, { sensitivity: "base" }),
    );
  }, [tasks]);

  const uniqueStatuses = useMemo(() => {
    const m = new Map<string, string>();
    for (const t of tasks) {
      m.set(t.status.id, t.status.name);
    }
    return [...m.entries()].sort((a, b) =>
      a[1].localeCompare(b[1], undefined, { sensitivity: "base" }),
    );
  }, [tasks]);

  const uniqueLabels = useMemo(() => {
    const m = new Map<string, { name: string; color: string }>();
    for (const t of tasks) {
      for (const { label } of t.labels) {
        m.set(label.id, { name: label.name, color: label.color });
      }
    }
    return [...m.entries()]
      .sort((a, b) =>
        a[1].name.localeCompare(b[1].name, undefined, {
          sensitivity: "base",
        }),
      )
      .map(([id, v]) => ({ id, ...v }));
  }, [tasks]);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filters.nameQuery.trim()) n++;
    if (filters.projectIds.length) n++;
    if (filters.due !== "all") n++;
    if (filters.priorityIds.length) n++;
    if (filters.labelIds.length) n++;
    if (filters.statusIds.length) n++;
    return n;
  }, [filters]);

  const clearFilters = useCallback(() => {
    setFilters(defaultInboxTableFilters());
  }, []);

  const filteredButEmpty =
    rows.length === 0 && tasks.length > 0 && activeFilterCount > 0;

  const colSpan = columnOrder.length;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Drag columns, filter, sort, or group by one column. Layout is saved to
          your account.
        </p>
        {activeFilterCount > 0 ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={clearFilters}
          >
            Clear filters ({activeFilterCount})
          </Button>
        ) : null}
      </div>

      <ScrollArea className="max-h-[min(70vh,900px)] w-full rounded-xl border border-border/60">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead className="sticky top-0 z-10">
              <SortableContext
                items={columnOrder}
                strategy={horizontalListSortingStrategy}
              >
                <tr>
                  {columnOrder.map((col) => (
                    <SortableTh
                      key={col}
                      column={col}
                      label={COLUMN_LABELS[col]}
                      sort={sort}
                      onSort={() => cycleSort(col)}
                      onOpenFilter={() => setFilterColumn(col)}
                      filterActive={columnHasActiveFilter(col, filters)}
                      groupByColumn={groupByColumn}
                    />
                  ))}
                </tr>
              </SortableContext>
            </thead>
            <tbody>
              {grouped
                ? grouped.map((g) => (
                    <FragmentRows
                      key={g.projectId ?? `${g.sortKey}:${g.groupLabel}`}
                      groupByColumn={groupByColumn}
                      groupLabel={g.groupLabel}
                      groupProjectId={g.projectId}
                      tasks={g.tasks}
                      columnOrder={columnOrder}
                      projectNamesById={projectNamesById}
                      projectColorsById={projectColorsById}
                      now={now}
                      colSpan={colSpan}
                      onOpenTask={onOpenTask}
                    />
                  ))
                : rows.map((task) => (
                    <tr
                      key={task.id}
                      className="cursor-pointer border-b border-border/50 odd:bg-muted/15 hover:bg-muted/35"
                      onClick={() => onOpenTask(task.id)}
                    >
                      {columnOrder.map((col) => (
                        <td
                          key={col}
                          className="max-w-[min(100vw,320px)] px-2 py-2 align-top"
                        >
                          {renderCell(col, task, projectNamesById, now)}
                        </td>
                      ))}
                    </tr>
                  ))}
            </tbody>
          </table>
        </DndContext>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {filteredButEmpty ? (
        <p className="text-center text-sm text-muted-foreground">
          No tasks match the current filters. Clear filters or adjust column
          filters.
        </p>
      ) : null}

      <Dialog
        open={filterColumn !== null}
        onOpenChange={(o) => {
          if (!o) setFilterColumn(null);
        }}
      >
        <DialogContent className="max-h-[min(90vh,480px)] overflow-y-auto sm:max-w-md">
          {filterColumn ? (
            <>
              <DialogHeader>
                <DialogTitle>Filter: {COLUMN_LABELS[filterColumn]}</DialogTitle>
                <DialogDescription>
                  Combine with other column filters; all active filters apply
                  together.
                </DialogDescription>
              </DialogHeader>
              <ColumnFilterForm
                column={filterColumn}
                filters={filters}
                setFilters={setFilters}
                uniqueProjects={uniqueProjects}
                uniquePriorities={uniquePriorities}
                uniqueStatuses={uniqueStatuses}
                uniqueLabels={uniqueLabels}
              />
              <div className="flex items-start gap-2 border-t border-border/60 pt-4">
                <Checkbox
                  id="inbox-group-by-col"
                  checked={groupByColumn === filterColumn}
                  onCheckedChange={(c) => {
                    if (c === true) setGroupByColumn(filterColumn);
                    else if (groupByColumn === filterColumn) {
                      setGroupByColumn(null);
                    }
                  }}
                />
                <div className="space-y-1">
                  <Label htmlFor="inbox-group-by-col" className="cursor-pointer">
                    Group by this column
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Tasks are grouped under each value (e.g. by project name).
                    Only one grouping column at a time.
                  </p>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FragmentRows({
  groupByColumn,
  groupLabel,
  groupProjectId,
  tasks,
  columnOrder,
  projectNamesById,
  projectColorsById,
  now,
  colSpan,
  onOpenTask,
}: {
  groupByColumn: InboxColumnId | null;
  groupLabel: string;
  groupProjectId?: string;
  tasks: SerializedBoardTask[];
  columnOrder: InboxColumnId[];
  projectNamesById: Record<string, string>;
  projectColorsById: Record<string, string | null>;
  now: Date;
  colSpan: number;
  onOpenTask: (id: string) => void;
}) {
  const tintHex =
    groupByColumn === "project" && groupProjectId
      ? projectColorsById[groupProjectId]
      : undefined;
  const groupHeaderStyle =
    tintHex != null && tintHex !== ""
      ? { backgroundColor: projectColorToRgba(tintHex, PROJECT_TINT_ALPHA) }
      : undefined;

  return (
    <>
      <tr className={cn(!groupHeaderStyle && "bg-muted/50")} style={groupHeaderStyle}>
        <td
          colSpan={colSpan}
          className="border-b border-border/60 px-2 py-1.5 text-xs font-semibold text-foreground"
        >
          {groupLabel}
        </td>
      </tr>
      {tasks.map((task) => (
        <tr
          key={task.id}
          className="cursor-pointer border-b border-border/50 odd:bg-muted/15 hover:bg-muted/35"
          onClick={() => onOpenTask(task.id)}
        >
          {columnOrder.map((col) => (
            <td
              key={col}
              className="max-w-[min(100vw,320px)] px-2 py-2 align-top"
            >
              {renderCell(col, task, projectNamesById, now)}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function ColumnFilterForm({
  column,
  filters,
  setFilters,
  uniqueProjects,
  uniquePriorities,
  uniqueStatuses,
  uniqueLabels,
}: {
  column: InboxColumnId;
  filters: InboxTableFilters;
  setFilters: Dispatch<SetStateAction<InboxTableFilters>>;
  uniqueProjects: [string, string][];
  uniquePriorities: [string, string][];
  uniqueStatuses: [string, string][];
  uniqueLabels: { id: string; name: string; color: string }[];
}) {
  if (column === "name") {
    return (
      <div className="space-y-2">
        <Label htmlFor="inbox-filter-name">Contains</Label>
        <Input
          id="inbox-filter-name"
          value={filters.nameQuery}
          onChange={(e) =>
            setFilters((f) => ({ ...f, nameQuery: e.target.value }))
          }
          placeholder="Task name or description"
          autoComplete="off"
        />
      </div>
    );
  }

  if (column === "project") {
    return (
      <div className="space-y-3">
        {uniqueProjects.length === 0 ? (
          <p className="text-sm text-muted-foreground">No projects in list.</p>
        ) : (
          uniqueProjects.map(([id, name]) => (
            <label
              key={id}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <Checkbox
                checked={filters.projectIds.includes(id)}
                onCheckedChange={(c) =>
                  setFilters((f) => {
                    const next = new Set(f.projectIds);
                    if (c === true) next.add(id);
                    else next.delete(id);
                    return { ...f, projectIds: [...next] };
                  })
                }
              />
              {name}
            </label>
          ))
        )}
      </div>
    );
  }

  if (column === "dueDate") {
    return (
      <div className="space-y-2">
        <Label htmlFor="inbox-filter-due">Due</Label>
        <Select
          value={filters.due}
          onValueChange={(v) =>
            setFilters((f) => ({
              ...f,
              due: v as InboxDueFilter,
            }))
          }
        >
          <SelectTrigger id="inbox-filter-due">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any</SelectItem>
            <SelectItem value="none">No due date</SelectItem>
            <SelectItem value="hasDate">Has a due date</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="today">Due today</SelectItem>
            <SelectItem value="week">Due in the next 7 days</SelectItem>
            <SelectItem value="later">Due later (after 7 days)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (column === "priority") {
    return (
      <div className="space-y-3">
        {uniquePriorities.map(([id, name]) => (
          <label
            key={id}
            className="flex cursor-pointer items-center gap-2 text-sm"
          >
            <Checkbox
              checked={filters.priorityIds.includes(id)}
              onCheckedChange={(c) =>
                setFilters((f) => {
                  const next = new Set(f.priorityIds);
                  if (c === true) next.add(id);
                  else next.delete(id);
                  return { ...f, priorityIds: [...next] };
                })
              }
            />
            {name}
          </label>
        ))}
      </div>
    );
  }

  if (column === "labels") {
    return (
      <div className="space-y-3">
        {uniqueLabels.length === 0 ? (
          <p className="text-sm text-muted-foreground">No labels in list.</p>
        ) : (
          uniqueLabels.map((lb) => (
            <label
              key={lb.id}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <Checkbox
                checked={filters.labelIds.includes(lb.id)}
                onCheckedChange={(c) =>
                  setFilters((f) => {
                    const next = new Set(f.labelIds);
                    if (c === true) next.add(lb.id);
                    else next.delete(lb.id);
                    return { ...f, labelIds: [...next] };
                  })
                }
              />
              <span
                className="inline-block size-2 rounded-full"
                style={{ backgroundColor: lb.color }}
              />
              {lb.name}
            </label>
          ))
        )}
      </div>
    );
  }

  if (column === "status") {
    return (
      <div className="space-y-3">
        {uniqueStatuses.map(([id, name]) => (
          <label
            key={id}
            className="flex cursor-pointer items-center gap-2 text-sm"
          >
            <Checkbox
              checked={filters.statusIds.includes(id)}
              onCheckedChange={(c) =>
                setFilters((f) => {
                  const next = new Set(f.statusIds);
                  if (c === true) next.add(id);
                  else next.delete(id);
                  return { ...f, statusIds: [...next] };
                })
              }
            />
            {name}
          </label>
        ))}
      </div>
    );
  }

  return null;
}
