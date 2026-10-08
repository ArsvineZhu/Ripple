import { SETTINGS_TAB_ID } from '../../shared/appState';
import type { PositionMode } from '../../shared/appState';

export function visibleTabIds(order: number[], hidden: number[], musicActive: boolean): number[] {
  return order.filter(
    (id) => (id === SETTINGS_TAB_ID || !hidden.includes(id)) && (id !== 3 || musicActive),
  );
}
export function nextTabId(visible: number[], current: number, direction: number): number {
  if (!visible.length) return current;
  const index = visible.indexOf(current);
  return visible[(index + direction + visible.length) % visible.length] ?? visible[0];
}

export function largeTabWidth(tabId: number, settingsContentWidth: number | null): number {
  if (tabId === SETTINGS_TAB_ID) return settingsContentWidth ?? 495;
  if (tabId === 1) return 480;
  if (tabId === 3) return 330;
  if (tabId === 0) return 405;
  return 380;
}

export function largeTabHeight(tabId: number, positionMode: PositionMode): number {
  if (tabId === SETTINGS_TAB_ID) return positionMode === 'free' ? 425 : 345;
  if (tabId === 6) return 250;
  if (tabId === 3) return 150;
  if (tabId === 0) return 120;
  if (tabId === 1) return 210;
  return 190;
}
