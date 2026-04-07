import { z } from "zod";
import {
  DEFAULT_INBOX_COLUMN_ORDER,
  type InboxColumnId,
  type InboxTableFilters,
  type InboxTableSort,
  defaultInboxTableFilters,
} from "@/lib/inbox/inbox-table-types";

const columnIdSchema = z.enum([
  "name",
  "project",
  "dueDate",
  "priority",
  "labels",
  "status",
]);

export type InboxPreferencesPersistedV1 = {
  version: 1;
  columnOrder: InboxColumnId[];
  filters: InboxTableFilters;
  sort: InboxTableSort;
  groupByColumn: InboxColumnId | null;
};

const filtersSchema = z.object({
  nameQuery: z.string(),
  projectIds: z.array(z.string()),
  due: z.enum([
    "all",
    "none",
    "hasDate",
    "overdue",
    "today",
    "week",
    "later",
  ]),
  priorityIds: z.array(z.string()),
  labelIds: z.array(z.string()),
  statusIds: z.array(z.string()),
});

const sortSchema = z.union([
  z.null(),
  z.object({
    column: columnIdSchema,
    direction: z.enum(["asc", "desc"]),
  }),
]);

export const inboxPreferencesV1Schema = z.object({
  version: z.literal(1),
  columnOrder: z.array(columnIdSchema),
  filters: filtersSchema,
  sort: sortSchema,
  groupByColumn: z.union([columnIdSchema, z.null()]),
});

export function defaultInboxPreferencesPersisted(): InboxPreferencesPersistedV1 {
  return {
    version: 1,
    columnOrder: [...DEFAULT_INBOX_COLUMN_ORDER],
    filters: defaultInboxTableFilters(),
    sort: null,
    groupByColumn: null,
  };
}

function isValidColumnOrder(order: InboxColumnId[]): boolean {
  if (order.length !== DEFAULT_INBOX_COLUMN_ORDER.length) return false;
  const set = new Set(order);
  for (const id of DEFAULT_INBOX_COLUMN_ORDER) {
    if (!set.has(id)) return false;
  }
  return true;
}

/** Parse DB JSON; on failure return defaults (never throw). */
export function parseInboxPreferencesJson(
  raw: unknown,
): InboxPreferencesPersistedV1 {
  const parsed = inboxPreferencesV1Schema.safeParse(raw);
  if (!parsed.success) {
    return defaultInboxPreferencesPersisted();
  }
  const v = parsed.data;
  if (!isValidColumnOrder(v.columnOrder)) {
    return {
      ...v,
      columnOrder: [...DEFAULT_INBOX_COLUMN_ORDER],
    };
  }
  return v;
}
