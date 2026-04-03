export const ActivityType = {
  TASK_CREATED: "task_created",
  TASK_UPDATED: "task_updated",
  STATUS_CHANGED: "status_changed",
  PRIORITY_CHANGED: "priority_changed",
  LABELS_CHANGED: "labels_changed",
  ATTACHMENT_ADDED: "attachment_added",
  COMMENT_ADDED: "comment_added",
  SUBTASK_ADDED: "subtask_added",
  SUBTASK_TOGGLED: "subtask_toggled",
} as const;

export type ActivityTypeValue = (typeof ActivityType)[keyof typeof ActivityType];
