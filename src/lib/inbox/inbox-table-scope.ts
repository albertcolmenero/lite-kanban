/** Stable DB scope keys for `UserInboxPreferences.scope`. */
export function inboxPreferencesScopeProjectsOverview(): string {
  return "projects-overview";
}

export function inboxPreferencesScopeProject(projectId: string): string {
  return `project:${projectId}`;
}
