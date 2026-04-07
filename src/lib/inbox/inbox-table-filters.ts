import type { SerializedBoardTask } from "@/app/(app)/projects/[id]/board/types";
import type {
  InboxColumnId,
  InboxTableFilters,
  InboxTableSort,
} from "@/lib/inbox/inbox-table-types";
import {
  inboxDueBucket,
  sortTasksForInbox,
} from "@/lib/tasks/sort-inbox-tasks";

function matchesDueFilter(
  dueDate: string | null,
  filter: InboxTableFilters["due"],
  now: Date,
): boolean {
  if (filter === "all") return true;
  if (filter === "none") return dueDate == null;
  if (filter === "hasDate") return dueDate != null;
  const b = inboxDueBucket(dueDate, now);
  if (filter === "overdue") return b === 0;
  if (filter === "today") return b === 1;
  if (filter === "week") return b === 2;
  if (filter === "later") return b === 3;
  return true;
}

function labelKey(t: SerializedBoardTask): string {
  return t.labels
    .map(({ label }) => label.name)
    .sort((a, b) => a.localeCompare(b))
    .join("|");
}

function compareByColumn(
  a: SerializedBoardTask,
  b: SerializedBoardTask,
  column: InboxColumnId,
  projectNamesById: Record<string, string>,
): number {
  switch (column) {
    case "name":
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    case "project": {
      const pa = projectNamesById[a.projectId] ?? "";
      const pb = projectNamesById[b.projectId] ?? "";
      return pa.localeCompare(pb, undefined, { sensitivity: "base" });
    }
    case "dueDate": {
      const ta = a.dueDate ? +new Date(a.dueDate) : NaN;
      const tb = b.dueDate ? +new Date(b.dueDate) : NaN;
      const aNull = Number.isNaN(ta);
      const bNull = Number.isNaN(tb);
      if (aNull && bNull) return 0;
      if (aNull) return 1;
      if (bNull) return -1;
      return ta - tb;
    }
    case "priority": {
      const d = a.priority.sortOrder - b.priority.sortOrder;
      if (d !== 0) return d;
      return a.name.localeCompare(b.name);
    }
    case "labels":
      return labelKey(a).localeCompare(labelKey(b));
    case "status":
      return a.status.name.localeCompare(b.status.name, undefined, {
        sensitivity: "base",
      });
    default:
      return 0;
  }
}

/** AND-combine column filters; does not sort. */
export function filterInboxTasksForTable(
  tasks: SerializedBoardTask[],
  filters: InboxTableFilters,
  now: Date = new Date(),
): SerializedBoardTask[] {
  const q = filters.nameQuery.trim().toLowerCase();

  return tasks.filter((t) => {
    if (q) {
      const nameOk = t.name.toLowerCase().includes(q);
      const descOk = (t.description ?? "").toLowerCase().includes(q);
      if (!nameOk && !descOk) return false;
    }

    if (filters.projectIds.length > 0) {
      if (!filters.projectIds.includes(t.projectId)) return false;
    }

    if (!matchesDueFilter(t.dueDate, filters.due, now)) return false;

    if (filters.priorityIds.length > 0) {
      if (!filters.priorityIds.includes(t.priorityId)) return false;
    }

    if (filters.labelIds.length > 0) {
      const ids = new Set(t.labels.map((x) => x.label.id));
      const any = filters.labelIds.some((id) => ids.has(id));
      if (!any) return false;
    }

    if (filters.statusIds.length > 0) {
      if (!filters.statusIds.includes(t.statusId)) return false;
    }

    return true;
  });
}

/** Apply user sort, or default inbox ordering when `sort` is null. */
export function sortInboxTasksForTable(
  tasks: SerializedBoardTask[],
  sort: InboxTableSort,
  projectNamesById: Record<string, string>,
): SerializedBoardTask[] {
  if (!sort) {
    return sortTasksForInbox(tasks);
  }
  const mult = sort.direction === "asc" ? 1 : -1;
  return [...tasks].sort((a, b) => {
    const c = compareByColumn(a, b, sort.column, projectNamesById);
    if (c !== 0) return c * mult;
    return compareByColumn(a, b, "name", projectNamesById) * mult;
  });
}

export function filterAndSortInboxTable(
  tasks: SerializedBoardTask[],
  filters: InboxTableFilters,
  sort: InboxTableSort,
  projectNamesById: Record<string, string>,
  now?: Date,
): SerializedBoardTask[] {
  const f = filterInboxTasksForTable(tasks, filters, now);
  return sortInboxTasksForTable(f, sort, projectNamesById);
}
