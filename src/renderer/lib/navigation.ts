export function visibleTabIds(order: number[], hidden: number[], musicActive: boolean): number[] {
  return order.filter((id) => !hidden.includes(id) && (id !== 3 || musicActive));
}
export function nextTabId(visible: number[], current: number, direction: number): number {
  if (!visible.length) return current;
  const index = visible.indexOf(current);
  return visible[(index + direction + visible.length) % visible.length] ?? visible[0];
}
