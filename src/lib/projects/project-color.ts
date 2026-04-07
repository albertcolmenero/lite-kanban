/** 6-digit hex including # */
const HEX6 = /^#[0-9A-Fa-f]{6}$/;

/** Curated presets for project accent (all valid #RRGGBB). */
export const PROJECT_COLOR_PALETTE = [
  "#64748b",
  "#78716c",
  "#dc2626",
  "#ea580c",
  "#d97706",
  "#ca8a04",
  "#65a30d",
  "#16a34a",
  "#059669",
  "#0d9488",
  "#0891b2",
  "#2563eb",
  "#4f46e5",
  "#7c3aed",
  "#9333ea",
  "#db2777",
] as const;

/** 80% transparency → 20% opacity (subtle tint). */
export const PROJECT_TINT_ALPHA = 0.2;

export function isValidProjectColorHex(value: string): boolean {
  return HEX6.test(value.trim());
}

/** Null = clear / use theme default. */
export function parseProjectColorInput(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return null;
  const t = value.trim();
  if (t === "") return null;
  return isValidProjectColorHex(t) ? t : null;
}

/** `hex` is `#RRGGBB`. Returns CSS `rgba(...)` with the given alpha. */
export function projectColorToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
