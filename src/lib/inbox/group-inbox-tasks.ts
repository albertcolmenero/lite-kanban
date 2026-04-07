import type { SerializedBoardTask } from "@/app/(app)/projects/[id]/board/types";
import type { InboxColumnId } from "@/lib/inbox/inbox-table-types";
import { inboxDueBucket } from "@/lib/tasks/sort-inbox-tasks";

const DUE_BUCKET_LABEL: Record<number, string> = {
  0: "Overdue",
  1: "Due today",
  2: "Due this week",
  3: "Due later",
  4: "No due date",
};

function groupLabelAndSortKey(
  task: SerializedBoardTask,
  column: InboxColumnId,
  projectNamesById: Record<string, string>,
  now: Date,
): { label: string; sortKey: string } {
  switch (column) {
    case "name": {
      const n = task.name.trim();
      if (!n) return { label: "(Empty)", sortKey: "zzz-empty" };
      const ch = n[0]!;
      const upper = ch.toUpperCase();
      const isLetter = /[A-Za-z]/.test(ch);
      const head = isLetter ? upper : "#";
      return {
        label: head,
        sortKey: `0-${isLetter ? upper : "#"}`,
      };
    }
    case "project": {
      const name = projectNamesById[task.projectId] ?? "—";
      return { label: name, sortKey: name.toLowerCase() };
    }
    case "dueDate": {
      const b = inboxDueBucket(task.dueDate, now);
      const label = DUE_BUCKET_LABEL[b] ?? "—";
      return { label, sortKey: `due-${b}` };
    }
    case "priority": {
      const name = task.priority.name;
      const sk = `${String(1_000_000 - task.priority.sortOrder).padStart(7, "0")}-${name.toLowerCase()}`;
      return { label: name, sortKey: sk };
    }
    case "labels": {
      if (task.labels.length === 0) {
        return { label: "No labels", sortKey: "zzz-no-labels" };
      }
      const sorted = [...task.labels]
        .map((x) => x.label.name)
        .sort((a, b) => a.localeCompare(b));
      const label = sorted.join(", ");
      return { label, sortKey: label.toLowerCase() };
    }
    case "status": {
      const name = task.status.name;
      return {
        label: name,
        sortKey: `${String(1_000_000 - task.status.sortOrder).padStart(7, "0")}-${name.toLowerCase()}`,
      };
    }
    default:
      return { label: "—", sortKey: "" };
  }
}

export type InboxTaskGroup = {
  groupLabel: string;
  sortKey: string;
  tasks: SerializedBoardTask[];
  /** Present when grouping by project column (stable id for styling). */
  projectId?: string;
};

/** Split filtered/sorted tasks into display groups (order of tasks within a group preserved). */
export function groupInboxTasksByColumn(
  tasks: SerializedBoardTask[],
  groupByColumn: InboxColumnId,
  projectNamesById: Record<string, string>,
  now: Date,
): InboxTaskGroup[] {
  const map = new Map<
    string,
    { sortKey: string; tasks: SerializedBoardTask[]; projectId?: string }
  >();

  for (const t of tasks) {
    const { label, sortKey } = groupLabelAndSortKey(
      t,
      groupByColumn,
      projectNamesById,
      now,
    );
    const key = groupByColumn === "project" ? t.projectId : label;
    const ex = map.get(key);
    if (ex) {
      ex.tasks.push(t);
    } else {
      map.set(key, {
        sortKey,
        tasks: [t],
        projectId: groupByColumn === "project" ? t.projectId : undefined,
      });
    }
  }

  return [...map.entries()]
    .map(([key, v]) => {
      const groupLabel =
        groupByColumn === "project"
          ? (projectNamesById[key] ?? "—")
          : key;
      return {
        groupLabel,
        sortKey: v.sortKey,
        tasks: v.tasks,
        projectId: v.projectId,
      };
    })
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey, undefined, { numeric: true }));
}
