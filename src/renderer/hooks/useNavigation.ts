import type {
  PointerEvent as ReactPointerEvent,
  WheelEvent,
  Dispatch,
  SetStateAction,
} from 'react';
import { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react';
import { flushSync } from 'react-dom';
import { animate, useMotionValue } from 'motion/react';
import type { MediaTrack, IslandMode } from '../../shared/contracts';
import { normalizeHiddenTabs, SETTINGS_TAB_ID } from '../../shared/appState';
import { visibleTabIds, nextTabId, largeTabWidth } from '../lib/navigation';
import {
  clampTrack,
  pageTargets as computePageTargets,
  settleTrack,
  updateWheelGesture,
  wheelContentDelta,
  TRACK_SPRING,
  WHEEL_SETTLE_MS,
} from '../lib/pageSwipe';
import type { PageTargets, WheelStream } from '../lib/pageSwipe';
import { isInteractiveTarget } from '../lib/interactions';
import { TABS } from '../lib/tabs';
import { useAppState } from '../components/AppStateProvider';

type TrackAnimation = { stop: () => void };

export function useNavigation({
  spotifyTrack,
  mode,
  isDragging,
  setMode,
  settingsContentWidth = null,
}: {
  spotifyTrack: MediaTrack | null;
  mode: IslandMode;
  isDragging: boolean;
  setMode: Dispatch<SetStateAction<IslandMode>>;
  settingsContentWidth?: number | null;
}) {
  const { state, updateState } = useAppState();
  const { tabOrder, hiddenTabs, defaultTabId } = state.settings;
  const setDefaultTabId = (defaultTabId: number) => updateState({ settings: { defaultTabId } });
  const moveTabOrder = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= tabOrder.length) return;
    const newOrder = [...tabOrder];
    const [moved] = newOrder.splice(fromIdx, 1);
    if (moved !== undefined) newOrder.splice(toIdx, 0, moved);
    updateState({ settings: { tabOrder: newOrder } });
  };
  const toggleTabVisibility = (id: number) => {
    if (id === SETTINGS_TAB_ID) return;
    const currentHiddenTabs = normalizeHiddenTabs(hiddenTabs);
    const newHidden = currentHiddenTabs.includes(id)
      ? currentHiddenTabs.filter((tab) => tab !== id)
      : [...currentHiddenTabs, id];
    if (newHidden.length < TABS.length) updateState({ settings: { hiddenTabs: newHidden } });
  };
  const isMusicActive = !!spotifyTrack;
  const visibleTabs = useMemo(
    () => visibleTabIds(tabOrder, hiddenTabs, isMusicActive),
    [tabOrder, hiddenTabs, isMusicActive],
  );
  const [currentTabId, setCurrentTabId] = useState(() =>
    visibleTabs.includes(defaultTabId) ? defaultTabId : (visibleTabs[0] ?? 0),
  );
  const currentTab = currentTabId;

  const previousTabId = visibleTabs.length > 1 ? nextTabId(visibleTabs, currentTabId, -1) : null;
  const followingTabId = visibleTabs.length > 1 ? nextTabId(visibleTabs, currentTabId, 1) : null;
  const previousTabWidth =
    previousTabId === null ? 0 : largeTabWidth(previousTabId, settingsContentWidth);
  const followingTabWidth =
    followingTabId === null ? 0 : largeTabWidth(followingTabId, settingsContentWidth);
  const pageTargets: PageTargets = computePageTargets({
    previous: previousTabId === null ? null : previousTabWidth,
    current: largeTabWidth(currentTabId, settingsContentWidth),
    following: followingTabId === null ? null : followingTabWidth,
  });

  // Rail offset in the current page's coordinates; 0 shows it, positive moves content right.
  const trackX = useMotionValue(0);
  // Tab id most recently reached by paging, so the shell can hand its size over without a spring.
  const pagingCommitRef = useRef<number | null>(null);
  const animationRef = useRef<TrackAnimation | null>(null);
  const pendingDirection = useRef<-1 | 0 | 1>(0);
  const wheelStream = useRef<WheelStream | null>(null);
  const wheelTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wheelVelocity = useRef(0);
  const activePointer = useRef<number | null>(null);
  const pointerOriginX = useRef(0);
  const swipeStartX = useRef(0);
  const swipeStartY = useRef(0);
  const swipeMoved = useRef(false);
  const suppressClick = useRef(false);
  const pointerListeners = useRef<{
    move: (event: PointerEvent) => void;
    up: (event: PointerEvent) => void;
  } | null>(null);
  const latest = useRef({ mode, isDragging, visibleTabs, currentTabId, pageTargets });
  useLayoutEffect(() => {
    latest.current = { mode, isDragging, visibleTabs, currentTabId, pageTargets };
  });

  const cancelWheelTimer = () => {
    if (wheelTimer.current) clearTimeout(wheelTimer.current);
    wheelTimer.current = null;
  };
  const detachPointerListeners = () => {
    const listeners = pointerListeners.current;
    if (!listeners) return;
    window.removeEventListener('pointermove', listeners.move);
    window.removeEventListener('pointerup', listeners.up);
    window.removeEventListener('pointercancel', listeners.up);
    pointerListeners.current = null;
  };
  // A stopped spring never resolves, so its pending page commit is dropped with it.
  const stopSpring = () => {
    pendingDirection.current = 0;
    const controls = animationRef.current;
    animationRef.current = null;
    controls?.stop();
    trackX.stop();
  };
  const resetTrack = () => {
    cancelWheelTimer();
    detachPointerListeners();
    activePointer.current = null;
    wheelStream.current = null;
    stopSpring();
    trackX.jump(0);
  };

  // Swaps the page synchronously; the layout effect below recentres the rail in the same pass.
  const commitPage = (direction: 1 | -1) => {
    const { mode: currentMode, visibleTabs: tabs, currentTabId: current } = latest.current;
    if (currentMode !== 'large' || tabs.length < 2) return;
    const next = nextTabId(tabs, current, direction);
    if (next === current) return;
    pagingCommitRef.current = next;
    flushSync(() => setCurrentTabId(next));
  };
  const springTo = (target: number, direction: -1 | 0 | 1) => {
    stopSpring();
    if (latest.current.mode !== 'large') {
      trackX.jump(0);
      return;
    }
    pendingDirection.current = direction;
    animationRef.current = animate(trackX, target, {
      ...TRACK_SPRING,
      onComplete: () => {
        const pending = pendingDirection.current;
        pendingDirection.current = 0;
        animationRef.current = null;
        if (pending !== 0) commitPage(pending);
      },
    });
  };
  /**
   * A new gesture takes over the rail. If a commit spring is still running, its page change is
   * applied first and the rail offset is re-expressed relative to the new page, so the next
   * gesture moves on from there instead of pushing the same commit a second page.
   */
  const takeOverTrack = () => {
    const direction = pendingDirection.current;
    if (direction === 0) {
      stopSpring();
      return;
    }
    const { pageTargets: targets } = latest.current;
    const x = trackX.get();
    const rebased = direction > 0 ? x + targets.following : x - targets.previous;
    stopSpring();
    commitPage(direction);
    trackX.jump(rebased);
  };
  const settle = (velocity: number) => {
    cancelWheelTimer();
    if (wheelStream.current) wheelStream.current.settled = true;
    if (latest.current.mode !== 'large' || latest.current.isDragging) {
      resetTrack();
      return;
    }
    const decision = settleTrack({
      x: trackX.get(),
      velocity,
      targets: latest.current.pageTargets,
    });
    springTo(decision.target, decision.direction);
  };

  useEffect(() => {
    if (visibleTabs.length > 0 && !visibleTabs.includes(currentTabId)) {
      pagingCommitRef.current = null;
      setCurrentTabId(visibleTabs[0]);
    }
  }, [hiddenTabs, visibleTabs, currentTabId]);

  // Swap pages and recentre in the same layout pass so the new page never flashes offset.
  useLayoutEffect(() => {
    trackX.jump(0);
  }, [currentTabId, trackX]);

  useEffect(() => {
    if (mode !== 'large') resetTrack();
    // resetTrack only touches refs and the stable motion value.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(
    () => () => {
      cancelWheelTimer();
      detachPointerListeners();
      pendingDirection.current = 0;
      animationRef.current?.stop();
    },
    // oxlint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const moveTab = useCallback(
    (direction: number) => {
      if (mode !== 'large') {
        setMode('large');
        return;
      }
      if (visibleTabs.length < 2) return;
      cancelWheelTimer();
      wheelStream.current = null;
      takeOverTrack();
      const step = direction > 0 ? 1 : -1;
      const targets = latest.current.pageTargets;
      springTo(step > 0 ? -targets.following : targets.previous, step);
    },
    // oxlint-disable-next-line react-hooks/exhaustive-deps
    [mode, setMode, visibleTabs],
  );

  // Test seam: run the commit a naturally finished spring would perform.
  const finishTrackAnimation = () => {
    const pending = pendingDirection.current;
    pendingDirection.current = 0;
    animationRef.current?.stop();
    animationRef.current = null;
    if (pending !== 0) commitPage(pending);
  };

  const clearClickSuppression = () => {
    suppressClick.current = false;
  };
  const consumeClickSuppression = () => {
    const suppressed = suppressClick.current;
    suppressClick.current = false;
    return suppressed;
  };

  const updatePointer = (clientX: number, clientY: number) => {
    if (activePointer.current === null) return;
    if (latest.current.mode !== 'large' || latest.current.isDragging) return;
    const dx = clientX - swipeStartX.current;
    const dy = clientY - swipeStartY.current;
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
      swipeMoved.current = true;
      suppressClick.current = true;
    }
    if (Math.abs(dy) > Math.abs(dx)) return;
    trackX.set(clampTrack(pointerOriginX.current + dx, latest.current.pageTargets));
  };
  const endPointer = (clientX: number, clientY: number) => {
    if (activePointer.current === null) return;
    activePointer.current = null;
    detachPointerListeners();
    setTimeout(() => {
      suppressClick.current = false;
    }, 100);
    if (latest.current.mode !== 'large' || latest.current.isDragging) {
      resetTrack();
      return;
    }
    const dx = clientX - swipeStartX.current;
    const dy = clientY - swipeStartY.current;
    if (!swipeMoved.current || Math.abs(dx) <= Math.abs(dy)) {
      settle(0);
      return;
    }
    settle(trackX.getVelocity());
  };

  const handleWheelSwipe = (e: WheelEvent<HTMLDivElement>) => {
    if (mode !== 'large' || isDragging || activePointer.current !== null) return;
    const time = e.timeStamp || performance.now();
    // Both axes are scaled the same way so a diagonal trackpad swipe keeps its intent.
    const deltaX = wheelContentDelta(e.deltaX, e.deltaMode);
    const deltaY = wheelContentDelta(e.deltaY, e.deltaMode);
    const update = updateWheelGesture(wheelStream.current, time, deltaX, deltaY);
    wheelStream.current = update.stream;
    if (update.startsGesture) {
      cancelWheelTimer();
      takeOverTrack();
      wheelVelocity.current = 0;
    }
    // A settled tail, an undecided axis or a vertical gesture never moves the rail. Events that
    // stay on the rail keep the gesture alive even when they carry no horizontal movement.
    if (update.stream.axis !== 'horizontal' || update.kind === 'ignore') return;
    const targets = latest.current.pageTargets;
    const x = clampTrack(trackX.get() + update.movement, targets);
    trackX.set(x);
    const velocity = trackX.getVelocity();
    if (velocity !== 0) wheelVelocity.current = velocity;
    cancelWheelTimer();
    // Reaching the neighbour commits at once; one stream can never page twice.
    if (
      (update.movement > 0 && targets.previous > 0 && x >= targets.previous) ||
      (update.movement < 0 && targets.following > 0 && x <= -targets.following)
    ) {
      wheelStream.current.settled = true;
      stopSpring();
      commitPage(update.movement > 0 ? -1 : 1);
      return;
    }
    wheelTimer.current = setTimeout(() => {
      wheelTimer.current = null;
      settle(wheelVelocity.current);
    }, WHEEL_SETTLE_MS);
  };

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const target = e.target;
    if (!(target instanceof Element)) {
      activePointer.current = null;
      return;
    }
    if (
      mode !== 'large' ||
      isDragging ||
      isInteractiveTarget(target) ||
      target?.closest('#userinput') ||
      target?.id === 'userinput'
    ) {
      activePointer.current = null;
      return;
    }
    cancelWheelTimer();
    wheelStream.current = null;
    takeOverTrack();
    activePointer.current = e.pointerId;
    pointerOriginX.current = trackX.get();
    swipeStartX.current = e.clientX;
    swipeStartY.current = e.clientY;
    swipeMoved.current = false;
    // Keep following the finger after it leaves the Island bounds.
    detachPointerListeners();
    const move = (event: PointerEvent) => {
      if (event.pointerId === activePointer.current) updatePointer(event.clientX, event.clientY);
    };
    const up = (event: PointerEvent) => {
      if (event.pointerId === activePointer.current) endPointer(event.clientX, event.clientY);
    };
    pointerListeners.current = { move, up };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  };
  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerId === activePointer.current) updatePointer(e.clientX, e.clientY);
  };
  const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerId === activePointer.current) endPointer(e.clientX, e.clientY);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        isInteractiveTarget(e.target) ||
        document.querySelector(
          '[data-island-overlay] [role="menu"], [data-island-overlay] [role="listbox"]',
        )
      )
        return;
      if (e.key === 'ArrowRight') {
        moveTab(1);
      } else if (e.key === 'ArrowLeft') {
        moveTab(-1);
      } else if (e.ctrlKey && e.key >= '1' && e.key <= '8') {
        const idx = parseInt(e.key) - 1;
        const targetId = visibleTabs[idx];
        if (targetId !== undefined) {
          // Direct jumps skip the rail and let the shell spring to the new size.
          resetTrack();
          pagingCommitRef.current = null;
          setMode('large');
          setCurrentTabId(targetId);
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [moveTab, visibleTabs, setMode]);

  return {
    tabOrder,
    hiddenTabs,
    defaultTabId,
    setDefaultTabId,
    moveTabOrder,
    toggleTabVisibility,
    currentTabId,
    currentTab,
    previousTabId,
    followingTabId,
    previousTabWidth,
    followingTabWidth,
    pageTargets,
    trackX,
    pagingCommitRef,
    finishTrackAnimation,
    clearClickSuppression,
    consumeClickSuppression,
    handleWheelSwipe,
    isInteractiveTarget,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  };
}
