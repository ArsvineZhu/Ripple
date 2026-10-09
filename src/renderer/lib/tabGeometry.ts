/** Expanded Island content size per tab. Settings is a compact open-window entry only. */
export function expandedTabSize(id: number) {
  const width = id === 7 ? 260 : id === 1 ? 480 : id === 3 ? 330 : id === 0 ? 405 : 380;
  const height =
    id === 7 ? 100 : id === 6 ? 250 : id === 3 ? 150 : id === 0 ? 120 : id === 1 ? 210 : 190;
  return { width, height };
}
