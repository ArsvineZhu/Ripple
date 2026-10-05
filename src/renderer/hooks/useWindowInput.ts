import { islandInputRectangle } from '../../shared/inputGeometry';
import { useEffect, useLayoutEffect, useRef } from 'react';

import type { InputRect } from '../../shared/contracts';

interface Point {
  x: number;
  y: number;
}

function contains(rect: DOMRect, point: Point) {
  return (
    point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom
  );
}

export function useWindowInput(onGeometryExit: () => void) {
  const islandElementRef = useRef<HTMLDivElement | null>(null);
  const lastWindowShapeRef = useRef<InputRect | null>(null);
  const lastBoundsRef = useRef<DOMRect | null>(null);
  const pointerPositionRef = useRef<Point | null>(null);
  const onGeometryExitRef = useRef(onGeometryExit);
  useLayoutEffect(() => {
    onGeometryExitRef.current = onGeometryExit;
  }, [onGeometryExit]);
  const trackPointerPosition = (event: { clientX: number; clientY: number }) => {
    pointerPositionRef.current = { x: event.clientX, y: event.clientY };
  };
  const syncLinuxWindowShape = () => {
    const element = islandElementRef.current;
    if (!element) return;

    const bounds = element.getBoundingClientRect();
    const previousBounds = lastBoundsRef.current;
    const pointerPosition = pointerPositionRef.current;
    if (
      previousBounds &&
      pointerPosition &&
      contains(previousBounds, pointerPosition) &&
      !contains(bounds, pointerPosition)
    ) {
      onGeometryExitRef.current();
    }
    lastBoundsRef.current = bounds;
    if (window.electronAPI?.platform !== 'linux') return;

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
  return { islandElementRef, syncLinuxWindowShape, trackPointerPosition };
}
