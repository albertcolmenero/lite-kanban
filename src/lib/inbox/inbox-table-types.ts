/** Logical columns for the inbox data table (order is user-controlled in the UI). */
export type InboxColumnId =
  | "name"
  | "project"
  | "dueDate"
  | "priority"
  | "labels"
  | "status";

export const DEFAULT_INBOX_COLUMN_ORDER: InboxColumnId[] = [
  "name",
  "project",
  "dueDate",
  "priority",
  "labels",
  "status",
];

/** Due-date bucket filter (aligned with `inboxDueBucket` in sort-inbox-tasks). */
export type InboxDueFilter =
  | "all"
  | "none"
  | "hasDate"
  | "overdue"
  | "today"
  | "week"
  | "later";

export type InboxTableFilters = {
  nameQuery: string;
  /** Empty = any project */
  projectIds: string[];
  due: InboxDueFilter;
  /** Empty = any priority */
  priorityIds: string[];
  /** Empty = any labels; otherwise task must include at least one */
  labelIds: string[];
  /** Empty = any status column */
  statusIds: string[];
};

export const defaultInboxTableFilters = (): InboxTableFilters => ({
  nameQuery: "",
  projectIds: [],
  due: "all",
  priorityIds: [],
  labelIds: [],
  statusIds: [],
});

export type InboxTableSort = {
  column: InboxColumnId;
  direction: "asc" | "desc";
} | null;
