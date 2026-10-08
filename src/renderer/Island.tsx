import styles from './styles/Island.module.css';
import { useOverlay } from './components/OverlayProvider';
import { motion, useTransform } from 'motion/react';
import { AnimatePresence } from 'motion/react';
import { useIslandController } from './hooks/useIslandController';
import { useIslandSize } from './hooks/useIslandSize';
import { largeTabHeight } from './lib/navigation';
import { QuickView } from './components/QuickView';
import { BrowserSearchTab } from './features/BrowserSearchTab';
import { WorkflowsTab } from './features/WorkflowsTab';
import { OverviewTab } from './features/OverviewTab';
import { NowPlayingTab } from './features/NowPlayingTab';
import { AssistantTab } from './features/AssistantTab';
import { ClipboardTab } from './features/ClipboardTab';
import { TasksTab } from './features/TasksTab';
import { SettingsTab } from './features/SettingsTab';
import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { SETTINGS_TAB_ID } from '../shared/appState';
import { recordIslandContext } from './lib/diagnostics';
export default function Island() {
  const controller = useIslandController();
  const [assistantAnswerHeight, setAssistantAnswerHeight] = useState(0);
  const resetAssistantAnswerHeight = useCallback(() => setAssistantAnswerHeight(0), []);
  const { setContainer, beginPointerGesture, consumeShellClick } = useOverlay();
  const {
    leave,
    finishPositionChange,
    isOverlayOpen,
    islandElementRef,
    setIsHovered,
    mode,
    showInfoWhenIdleEnabled,
    isPlaying,
    setMode,
    clearClickSuppression,
    consumeClickSuppression,
    isInteractiveTarget,
    handleWheelSwipe,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    sideStyles,
    width,
    height,
    hideNotActiveIslandEnabled,
    bgColor,
    textColor,
    isHovered,
    theme,
    currentTab,
    syncLinuxWindowShape,
    bgImage,
    islandBorderEnabled,
    cameraInUse,
    microphoneInUse,
    charging,
    chargingAlert,
    percent,
    alert,
    bluetoothAlert,
    currentTabId,
    previousTabId,
    followingTabId,
    previousTabWidth,
    followingTabWidth,
    pageTargets,
    trackX,
    pagingCommitRef,
    positionMode,
    trackPointerPosition,
  } = controller;
  const renderTab = (tabId: number, isCurrent: boolean): ReactNode => {
    switch (tabId) {
      case 0:
        return <BrowserSearchTab {...controller} />;
      case 1:
        return <WorkflowsTab {...controller} />;
      case 2:
        return <OverviewTab {...controller} />;
      case 3:
        return <NowPlayingTab {...controller} />;
      case 4:
        return (
          <AssistantTab
            {...controller}
            onAnswerContentSizeChange={setAssistantAnswerHeight}
            resetAnswerContentSize={resetAssistantAnswerHeight}
          />
        );
      case 5:
        return <ClipboardTab {...controller} />;
      case 6:
        return <TasksTab {...controller} />;
      case SETTINGS_TAB_ID:
        // Settings measures and writes the shell width on mount, so it only mounts once current.
        return isCurrent ? (
          <SettingsTab {...controller} />
        ) : (
          <div className={styles.settingsPlaceholder} />
        );
      default:
        return null;
    }
  };
  const reportIslandContext = useCallback(() => {
    const bounds = islandElementRef.current?.getBoundingClientRect();
    if (!bounds) return;
    recordIslandContext({
      tabId: currentTabId,
      mode,
      expanded: mode === 'large',
      asked: controller.asked,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      inputRegion: { width: bounds.width, height: bounds.height },
    });
  }, [controller.asked, currentTabId, islandElementRef, mode]);
  useEffect(() => {
    reportIslandContext();
    window.addEventListener('resize', reportIslandContext);
    return () => window.removeEventListener('resize', reportIslandContext);
  }, [reportIslandContext]);
  // Page heights match what the shell uses once that page is current (assistant grows with answers).
  const pageHeight = (tabId: number) => {
    const base = largeTabHeight(tabId, positionMode);
    return tabId === 4 && controller.asked
      ? Math.min(Math.max(base, window.innerHeight - 80), Math.max(base, assistantAnswerHeight))
      : base;
  };
  const animatedHeight = mode === 'large' ? pageHeight(currentTab) : height;
  const shell = useIslandSize({
    resting: { width, height: animatedHeight },
    currentTabId,
    pagingCommitRef,
    trackX,
    pageTargets,
    previous:
      previousTabId === null
        ? null
        : { width: previousTabWidth, height: pageHeight(previousTabId) },
    following:
      followingTabId === null
        ? null
        : { width: followingTabWidth, height: pageHeight(followingTabId) },
    onSettled: () => {
      syncLinuxWindowShape();
      reportIslandContext();
    },
  });
  const pageSlots: {
    tabId: number;
    slot: 'previous' | 'current' | 'following' | 'shared';
    width: number;
    height: number;
  }[] = [];
  if (previousTabId !== null && previousTabId === followingTabId) {
    pageSlots.push({
      tabId: previousTabId,
      slot: 'shared',
      width: previousTabWidth,
      height: pageHeight(previousTabId),
    });
  } else {
    if (previousTabId !== null) {
      pageSlots.push({
        tabId: previousTabId,
        slot: 'previous',
        width: previousTabWidth,
        height: pageHeight(previousTabId),
      });
    }
    if (followingTabId !== null) {
      pageSlots.push({
        tabId: followingTabId,
        slot: 'following',
        width: followingTabWidth,
        height: pageHeight(followingTabId),
      });
    }
  }
  pageSlots.push({ tabId: currentTabId, slot: 'current', width, height: animatedHeight });
  // With only two visible pages the single neighbour sits on whichever side the rail is moving.
  const sharedNeighbourLeft = useTransform(trackX, (x) => (x > 0 ? -previousTabWidth : width));
  // Pages hang from the shell edge that stays put while it resizes.
  const alignBottom = !!sideStyles.bottom && sideStyles.bottom !== 'auto';
  return (
    <motion.div
      id="Island"
      className={styles.Island}
      data-island
      data-theme={theme}
      ref={islandElementRef}
      onMouseEnter={(event) => {
        trackPointerPosition(event);
        setIsHovered(true);
        if (mode === 'still' && showInfoWhenIdleEnabled && !isPlaying) {
          setMode('large');
        } else if (mode !== 'large') {
          setMode('quick');
        }
      }}
      onMouseLeave={(event) => {
        trackPointerPosition(event);
        clearClickSuppression();
        leave();
      }}
      onClick={(e) => {
        if (consumeShellClick() || isOverlayOpen) return;
        if (consumeClickSuppression()) {
          return;
        }
        if (isInteractiveTarget(e.target)) return;

        const activeTag = document.activeElement?.tagName;
        if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT') {
          (document.activeElement as HTMLElement).blur();
        }

        setMode((prev) => (prev === 'large' ? 'quick' : 'large'));
        if (window.electronAPI) {
          window.electronAPI.setIgnoreMouseEvents(false, false);
        }
      }}
      onWheel={(event) => {
        if (!isOverlayOpen) handleWheelSwipe(event);
      }}
      onPointerDownCapture={beginPointerGesture}
      onPointerDown={(event) => {
        if (!isOverlayOpen) handlePointerDown(event);
      }}
      onPointerMove={(event) => {
        trackPointerPosition(event);
        handlePointerMove(event);
      }}
      onPointerUp={(event) => {
        if (!isOverlayOpen) handlePointerUp(event);
      }}
      initial={{
        x: sideStyles.x,
        left: sideStyles.left,
        top: sideStyles.top || 'auto',
        bottom: sideStyles.bottom || 'auto',
      }}
      animate={{
        left: sideStyles.left,
        top: sideStyles.top || 'auto',
        bottom: sideStyles.bottom || 'auto',
        backgroundColor: hideNotActiveIslandEnabled && mode === 'still' ? 'rgba(0,0,0,0)' : bgColor,
        color: hideNotActiveIslandEnabled && mode === 'still' ? 'rgba(0,0,0,0)' : textColor,
        scale: isHovered ? 1.05 : 1,
        x: sideStyles.x,
        borderRadius:
          mode === 'large' && theme === 'win95'
            ? 0
            : mode === 'large'
              ? currentTab === 0
                ? 28
                : 30
              : theme === 'win95'
                ? 0
                : 14,
      }}
      onUpdate={syncLinuxWindowShape}
      onAnimationComplete={() => {
        syncLinuxWindowShape();
        reportIslandContext();
        finishPositionChange();
      }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 40,
        mass: 2.5,
        x: { duration: 0.15 },
      }}
      style={{
        width: shell.width,
        height: shell.height,
        backgroundImage: `url('${bgImage}')`,
        justifyContent: mode === 'large' && currentTab === 3 ? 'flex-start' : 'center',
        border:
          theme === 'win95'
            ? '2px solid rgb(254, 254, 254)'
            : islandBorderEnabled
              ? cameraInUse
                ? `1px solid rgba(255, 215, 0, 0.8)`
                : microphoneInUse
                  ? `1px solid rgba(255, 154, 0, 0.8)`
                  : charging || chargingAlert
                    ? `1px solid rgba(111, 255, 123, 0.5)`
                    : (typeof percent === 'number' && percent <= 20) || alert
                      ? `1px solid rgba(255, 63, 63, 0.5)`
                      : bluetoothAlert
                        ? `1px solid rgba(0, 150, 255, 0.34)`
                        : hideNotActiveIslandEnabled
                          ? 'none'
                          : `1px solid color-mix(in srgb, ${textColor}, transparent 70%)`
              : 'none',
        borderColor: theme === 'win95' ? '#FFFFFF #808080 #808080 #FFFFFF' : 'none',

        boxShadow:
          hideNotActiveIslandEnabled && mode === 'still'
            ? 'none'
            : isHovered
              ? '0 0 32px rgba(0, 0, 0, 0.25)'
              : '0 0 24px rgba(0, 0, 0, 0.12)',
        ...({
          '--island-text-color': textColor,
          '--island-bg-color': bgColor,
        } as import('motion/react').MotionStyle),
      }}
    >
      {/*Quickview*/}
      <QuickView {...controller} />

      <AnimatePresence>
        {mode === 'large' && (
          <motion.div
            key="pages"
            className={styles.pageViewport}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <motion.div className={styles.pageRail} style={{ x: trackX }}>
              {pageSlots.map(({ tabId, slot, width: slotWidth, height: slotHeight }) => (
                // Keyed by tab id in one list, so a committed neighbour moves into place without remounting.
                // Every page keeps its own size; only the shell around them resizes.
                <motion.div
                  key={tabId}
                  className={styles.tabPanel}
                  style={{
                    width: slotWidth,
                    height: slotHeight,
                    left:
                      slot === 'current'
                        ? 0
                        : slot === 'previous'
                          ? -slotWidth
                          : slot === 'following'
                            ? width
                            : sharedNeighbourLeft,
                    top: alignBottom ? 'auto' : 0,
                    bottom: alignBottom ? 0 : 'auto',
                  }}
                  aria-hidden={slot === 'current' ? undefined : true}
                  inert={slot !== 'current'}
                >
                  {renderTab(tabId, slot === 'current')}
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <div ref={setContainer} data-island-overlay className={styles.overlay} />
    </motion.div>
  );
}
