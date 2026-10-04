import { useCallback, useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { IslandMode } from '../../shared/contracts';
import { useOverlay } from '../components/OverlayProvider';
interface Options {
  setMode: Dispatch<SetStateAction<IslandMode>>;
  standby: boolean;
  largeStandby: boolean;
}
export function useIslandInteraction({ setMode, standby, largeStandby }: Options) {
  const [isHovered, setHovered] = useState(false);
  const hovered = useRef(false);
  const setIsHovered = (value: boolean) => {
    hovered.current = value;
    setHovered(value);
  };
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const positionChanging = useRef(false);
  const { openId } = useOverlay();
  const collapse = useCallback(() => {
    if (positionChanging.current || isDraggingRef.current || openId) return;
    const activeTag = document.activeElement?.tagName;
    if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;
    setMode(standby ? 'quick' : largeStandby ? 'large' : 'still');
  }, [openId, setMode, standby, largeStandby]);
  useEffect(() => {
    const onFocusOut = (event: FocusEvent) => {
      if (positionChanging.current || openId) return;
      if (event.relatedTarget instanceof Element && event.relatedTarget.closest('#Island')) return;
      if (!hovered.current) collapse();
    };
    window.addEventListener('focusout', onFocusOut);
    return () => window.removeEventListener('focusout', onFocusOut);
  }, [collapse, openId]);
  const updateDragging = (value: boolean) => {
    isDraggingRef.current = value;
    setIsDragging(value);
  };
  const beginPositionChange = () => {
    positionChanging.current = true;
    setMode('large');
  };
  const finishPositionChange = () => {
    positionChanging.current = false;
  };
  const leave = () => {
    setIsHovered(false);
    if (positionChanging.current || isDraggingRef.current || openId) return;
    void window.electronAPI?.setIgnoreMouseEvents(true, true);
    collapse();
  };
  return {
    isHovered,
    setIsHovered,
    isDragging,
    updateDragging,
    beginPositionChange,
    finishPositionChange,
    leave,
    isOverlayOpen: openId !== null,
  };
}
