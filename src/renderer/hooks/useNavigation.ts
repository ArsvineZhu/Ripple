import { isInteractiveTarget } from '../lib/interactions';
import type { PointerEvent, WheelEvent, Dispatch, SetStateAction } from 'react';
import type { MediaTrack, IslandMode } from '../../shared/contracts';
import { visibleTabIds, nextTabId } from '../lib/navigation';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

import { TABS } from '../lib/tabs';
import { storage } from '../lib/storage';
export function useNavigation({
  spotifyTrack,
  mode,
  isDragging,
  setMode,
}: {
  spotifyTrack: MediaTrack | null;
  mode: IslandMode;
  isDragging: boolean;
  setMode: Dispatch<SetStateAction<IslandMode>>;
}) {
  const [tabOrder, setTabOrder] = useState(() =>
    storage.read('tab-order', [0, 1, 2, 3, 4, 5, 6, 7]),
  );
  const [hiddenTabs, setHiddenTabs] = useState(() => storage.read('hidden-tabs', []));
  const [defaultTabId, setDefaultTabId] = useState(() =>
    Number(storage.getItem('default-tab') || 0),
  );
  const moveTabOrder = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= tabOrder.length) return;
    setTabOrder((prev) => {
      const newOrder = [...prev];
      const [moved] = newOrder.splice(fromIdx, 1);
      newOrder.splice(toIdx, 0, moved);
      storage.setItem('tab-order', JSON.stringify(newOrder));
      return newOrder;
    });
  };
  const toggleTabVisibility = (id: number) => {
    setHiddenTabs((prev) => {
      const newHidden = prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id];

      // Don't allow hiding all tabs
      if (newHidden.length >= TABS.length) return prev;

      storage.setItem('hidden-tabs', JSON.stringify(newHidden));
      return newHidden;
    });
  };
  const isMusicActive = !!spotifyTrack;
  const visibleTabs = useMemo(
    () => visibleTabIds(tabOrder, hiddenTabs, isMusicActive),
    [tabOrder, hiddenTabs, isMusicActive],
  );
  const [[currentTabId, direction], setTabState] = useState<[number, number]>(() => {
    const id = visibleTabs.includes(defaultTabId) ? defaultTabId : (visibleTabs[0] ?? 0);
    return [id, 0];
  });
  const currentTab = currentTabId;

  useEffect(() => {
    if (visibleTabs.length > 0 && !visibleTabs.includes(currentTabId)) {
      setTabState([visibleTabs[0], 0]);
    }
  }, [hiddenTabs, visibleTabs, currentTabId]);
  const tabVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : direction < 0 ? -300 : 0,
      opacity: 0,
      scale: 0.95,
      filter: 'blur(10px)',
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)',
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : direction > 0 ? -300 : 0,
      opacity: 0,
      scale: 0.95,
      filter: 'blur(10px)',
    }),
  };
  const wheelSwipeThreshold = 60;
  const wheelLockout = useRef(false);
  const wheelAccumulator = useRef(0);
  const wheelResetTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const swipeStartX = useRef<number | null>(0);
  const swipeStartY = useRef(0);
  const swipeMoved = useRef(false);
  const suppressClick = useRef(false);
  const swipeThreshold = 60;
  const moveTab = useCallback(
    (direction: number) => {
      if (mode !== 'large') {
        setMode('large');
        return;
      }
      setTabState([nextTabId(visibleTabs, currentTabId, direction), direction]);
    },
    [mode, setMode, visibleTabs, currentTabId],
  );
  const clearClickSuppression = () => {
    suppressClick.current = false;
  };
  const consumeClickSuppression = () => {
    const suppressed = suppressClick.current;
    suppressClick.current = false;
    return suppressed;
  };
  const handleWheelSwipe = (e: WheelEvent<HTMLDivElement>) => {
    if (wheelLockout.current || mode !== 'large' || isDragging) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) return;
    let delta = e.deltaX;
    if (e.deltaMode === 1) delta *= 40;
    if (e.deltaMode === 2) delta *= 800;
    wheelAccumulator.current += delta;
    if (wheelResetTimeout.current) clearTimeout(wheelResetTimeout.current);
    wheelResetTimeout.current = setTimeout(() => {
      wheelAccumulator.current = 0;
    }, 150);

    if (Math.abs(wheelAccumulator.current) >= wheelSwipeThreshold) {
      const isNext = wheelAccumulator.current > 0;
      wheelLockout.current = true;
      wheelAccumulator.current = 0;

      moveTab(isNext ? 1 : -1);
      setTimeout(() => {
        wheelLockout.current = false;
      }, 800);
    }
  };
  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const target = e.target;
    if (!(target instanceof Element)) {
      swipeStartX.current = null;
      return;
    }
    if (
      mode !== 'large' ||
      isDragging ||
      isInteractiveTarget(target) ||
      target?.closest('#userinput') ||
      target?.id === 'userinput'
    ) {
      swipeStartX.current = null;
      return;
    }
    swipeStartX.current = e.clientX;
    swipeStartY.current = e.clientY;
    swipeMoved.current = false;
  };
  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (swipeStartX.current === null || mode !== 'large') return;
    const dx = Math.abs(e.clientX - swipeStartX.current);
    const dy = Math.abs(e.clientY - swipeStartY.current);
    if (dx > 8 || dy > 8) {
      swipeMoved.current = true;
      suppressClick.current = true;
    }
  };
  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    setTimeout(() => {
      suppressClick.current = false;
    }, 100);

    if (swipeStartX.current === null) return;
    const startX = swipeStartX.current;
    const startY = swipeStartY.current;
    swipeStartX.current = null;

    if (mode !== 'large' || isDragging || wheelLockout.current) return;
    if (!swipeMoved.current) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.abs(dx) < swipeThreshold || Math.abs(dx) <= Math.abs(dy)) return;

    wheelLockout.current = true;
    moveTab(dx > 0 ? -1 : 1);
    setTimeout(() => {
      wheelLockout.current = false;
    }, 800);
  };
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        moveTab(1);
      } else if (e.key === 'ArrowLeft') {
        moveTab(-1);
      } else if (e.ctrlKey && e.key >= '1' && e.key <= '8') {
        const idx = parseInt(e.key) - 1;
        if (visibleTabs[idx] !== undefined) {
          const targetId = visibleTabs[idx];
          setMode('large');
          setTabState([targetId, targetId > currentTabId ? 1 : -1]);
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [moveTab, currentTabId, visibleTabs, setMode]);
  return {
    tabOrder,
    hiddenTabs,
    defaultTabId,
    setDefaultTabId,
    moveTabOrder,
    toggleTabVisibility,
    currentTabId,
    direction,
    currentTab,
    tabVariants,
    clearClickSuppression,
    consumeClickSuppression,
    handleWheelSwipe,
    isInteractiveTarget,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  };
}
