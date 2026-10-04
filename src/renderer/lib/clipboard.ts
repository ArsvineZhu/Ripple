/** Image-only and empty clipboard reads have no visible text to show. */
export function updateClipboardHistory(history: string[], text: string): string[] {
  const visible = (value: string) => /[^\s\p{Cf}]/u.test(value);
  const filtered = history.filter(visible);
  const current = filtered.length === history.length ? history : filtered;
  if (!visible(text) || current[0] === text) return current;
  return [text, ...current];
}
