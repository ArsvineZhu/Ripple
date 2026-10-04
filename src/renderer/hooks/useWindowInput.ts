import { islandInputRectangle } from '../../shared/inputGeometry';
import { useEffect, useRef } from 'react';

import type { InputRect } from '../../shared/contracts';

export function useWindowInput() {
  const islandElementRef = useRef<HTMLDivElement | null>(null);
  const lastWindowShapeRef = useRef<InputRect | null>(null);
  const syncLinuxWindowShape = () => {
    if (window.electronAPI?.platform !== 'linux') return;

    const element = islandElementRef.current;
    if (!element) return;

    const bounds = element.getBoundingClientRect();
    const rect = islandInputRectangle(
      bounds,
      { width: window.innerWidth, height: window.innerHeight },
      window.devicePixelRatio || 1,
    );

    if (rect.width <= 0 || rect.height <= 0) return;
    const previous = lastWindowShapeRef.current;
    if (
      previous &&
      previous.x === rect.x &&
      previous.y === rect.y &&
      previous.width === rect.width &&
      previous.height === rect.height &&
      previous.scaleFactor === rect.scaleFactor
    )
      return;

    lastWindowShapeRef.current = rect;
    window.electronAPI.setWindowInputShape(rect);
  };
  useEffect(() => {
    syncLinuxWindowShape();
    window.addEventListener('resize', syncLinuxWindowShape);
    return () => window.removeEventListener('resize', syncLinuxWindowShape);
  }, []);
  return { islandElementRef, syncLinuxWindowShape };
}
