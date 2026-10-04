import type { InputRect } from './contracts';
export function toDeviceRectangle(rect: InputRect): [number, number, number, number] {
  const scale = Number.isFinite(rect.scaleFactor) && rect.scaleFactor > 0 ? rect.scaleFactor : 1;
  return [
    Math.floor(rect.x * scale),
    Math.floor(rect.y * scale),
    Math.ceil(rect.width * scale),
    Math.ceil(rect.height * scale),
  ];
}
export function islandInputRectangle(
  bounds: { left: number; top: number; right: number; bottom: number },
  viewport: { width: number; height: number },
  scaleFactor: number,
): InputRect {
  const padding = 28;
  const x = Math.max(0, Math.floor(bounds.left - padding));
  const y = Math.max(0, Math.floor(bounds.top - padding));
  const right = Math.min(viewport.width, Math.ceil(bounds.right + padding));
  const bottom = Math.min(viewport.height, Math.ceil(bounds.bottom + padding));
  return { x, y, width: right - x, height: bottom - y, scaleFactor };
}
