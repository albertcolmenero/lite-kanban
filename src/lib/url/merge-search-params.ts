/** Merge patch into current search params; empty string or undefined removes the key. */
export function mergeSearchParams(
  current: URLSearchParams,
  patch: Record<string, string | undefined>,
) {
  const n = new URLSearchParams(current.toString());
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined || v === "") n.delete(k);
    else n.set(k, v);
  }
  return n;
}
