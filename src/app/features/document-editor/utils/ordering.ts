/** Clone records as well as the array: the current view remains authoritative until confirmation. */
export function reorder<T extends { sortId: number }>(
  items: readonly T[],
  from: number,
  to: number
): T[] {
  const ordered = items.map((item) => ({ ...item }));
  if (
    from < 0 ||
    to < 0 ||
    from >= ordered.length ||
    to >= ordered.length
  )
    return ordered;
  const [moved] = ordered.splice(from, 1);
  ordered.splice(to, 0, moved);
  return ordered.map((item, sortId) => ({ ...item, sortId }));
}
