/** Search and data-empty pages share one compact target; populated pages keep their own sizes. */
export function expandedTabSize(id: number, empty = false) {
  if (id === 0 || empty) return { width: 405, height: 120 };
  const width = id === 7 ? 260 : id === 1 ? 480 : id === 3 ? 330 : 380;
  const height = id === 7 ? 100 : id === 6 ? 250 : id === 3 ? 150 : id === 1 ? 210 : 190;
  return { width, height };
}
