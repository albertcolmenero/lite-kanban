/** Inbox ordering: overdue → due today → due in 7d → later / no date; then priority desc, updatedAt desc. */

export type InboxSortableTask = {
  priority: { sortOrder: number };
  dueDate: Date | string | null;
  updatedAt: Date | string;
  position?: number;
};

function startOfUtcDay(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function dueDayStartMs(due: Date | string): number {
  const x = typeof due === "string" ? new Date(due) : due;
  return startOfUtcDay(x);
}

/** Lower = earlier in inbox (more urgent). */
export function inboxDueBucket(
  dueDate: Date | string | null,
  now: Date = new Date(),
): number {
  if (dueDate == null) return 4;
  const today = startOfUtcDay(now);
  const due = dueDayStartMs(dueDate);
  const diffDays = Math.round((due - today) / 86_400_000);
  if (diffDays < 0) return 0;
  if (diffDays === 0) return 1;
  if (diffDays <= 7) return 2;
  return 3;
}

export function sortTasksForInbox<T extends InboxSortableTask>(tasks: T[]): T[] {
  const now = new Date();
  return [...tasks].sort((a, b) => {
    const ba = inboxDueBucket(a.dueDate, now);
    const bb = inboxDueBucket(b.dueDate, now);
    if (ba !== bb) return ba - bb;
    const pa = a.priority.sortOrder;
    const pb = b.priority.sortOrder;
    if (pa !== pb) return pb - pa;
    const ua = +new Date(a.updatedAt);
    const ub = +new Date(b.updatedAt);
    if (ua !== ub) return ub - ua;
    const posA = a.position ?? 0;
    const posB = b.position ?? 0;
    return posA - posB;
  });
}
