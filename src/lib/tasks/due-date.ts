/** `YYYY-MM-DD` from HTML date input → UTC noon to limit timezone shifts when reading back. */
export function dateFromDateOnlyInput(isoDate: string): Date {
  return new Date(`${isoDate}T12:00:00.000Z`);
}

export function formatTaskDueDateForInput(d: Date | null | undefined): string {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

/** Serialized task `dueDate` ISO string → `YYYY-MM-DD` for `<input type="date">`. */
export function dueDateIsoToInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Date(iso).toISOString().slice(0, 10);
}

/** For ISO strings from serialized JSON. */
export function formatDueDateShort(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return null;
  return t.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
