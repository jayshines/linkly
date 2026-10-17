/**
 * Validates a submitted link order against the user's actual links and returns
 * the (id, position) pairs to write. Returns null if the lists don't match, so
 * a stale or tampered request can't drop, duplicate or add links.
 */
export function planReorder(currentIds: string[], submittedIds: string[]) {
  if (submittedIds.length !== currentIds.length) return null;
  const current = new Set(currentIds);
  const seen = new Set<string>();
  for (const id of submittedIds) {
    if (!current.has(id) || seen.has(id)) return null;
    seen.add(id);
  }
  return submittedIds.map((id, position) => ({ id, position }));
}
