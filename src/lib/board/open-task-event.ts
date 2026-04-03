export const OPEN_PROJECT_TASK_EVENT = "lite-kanban:open-project-task";

export function dispatchOpenProjectTask(taskId: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(OPEN_PROJECT_TASK_EVENT, { detail: { taskId } }),
  );
}
