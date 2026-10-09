import type { Display, Rectangle } from 'electron';

export function getWindowBoundsForDisplay(
  display: Pick<Display, 'bounds' | 'workArea'>,
  platform = process.platform,
): Rectangle {
  const area =
    display.workArea.width > 0 && display.workArea.height > 0 ? display.workArea : display.bounds;
  if (platform !== 'win32') return { ...area };
  // Auto-hide taskbars can report the entire display as workArea. Leave the
  // activation edges uncovered, including fractional-scale rounding in Electron.
  return {
    x: area.x + 2,
    y: area.y + 2,
    width: Math.max(1, area.width - 4),
    height: Math.max(1, area.height - 4),
  };
}
