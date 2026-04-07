export type TaskFilterState = {
  search?: string;
  statusIds?: string[];
  priorityId?: string;
  labelIds?: string[];
};

function spVal(
  sp: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const v = sp[key];
  if (v === undefined) return undefined;
  if (Array.isArray(v)) return v.length ? v.join(",") : undefined;
  return v;
}

export function parseTaskFiltersFromSearchParams(
  sp: Record<string, string | string[] | undefined>,
): TaskFilterState {
  const q = spVal(sp, "q");
  const statusRaw = spVal(sp, "status");
  const priority = spVal(sp, "priority");
  const labelsRaw = spVal(sp, "labels");

  const status =
    statusRaw && statusRaw.length > 0
      ? statusRaw.split(",").filter(Boolean)
      : undefined;
  const labels =
    labelsRaw && labelsRaw.length > 0
      ? labelsRaw.split(",").filter(Boolean)
      : undefined;

  return {
    search: q?.trim() || undefined,
    statusIds: status?.length ? status : undefined,
    priorityId: priority?.length ? priority : undefined,
    labelIds: labels?.length ? labels : undefined,
  };
}

export type BoardViewMode = "grid" | "list" | "inbox";

/** Grid layout (kanban). `view=list` = priority list; `view=inbox` = pending (non-final) tasks; default grid. */
export function boardViewFromSearchParams(
  sp: Record<string, string | string[] | undefined>,
): BoardViewMode {
  const v = spVal(sp, "view");
  if (v === "list") return "list";
  if (v === "inbox") return "inbox";
  return "grid";
}

/** Map URLSearchParams to the record shape used by parseTaskFiltersFromSearchParams (API routes). */
export function recordFromUrlSearchParams(
  sp: URLSearchParams,
): Record<string, string | string[] | undefined> {
  const out: Record<string, string | string[] | undefined> = {};
  for (const key of new Set(sp.keys())) {
    const values = sp.getAll(key);
    out[key] = values.length > 1 ? values : values[0];
  }
  return out;
}
