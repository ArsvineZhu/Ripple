import { useTranslation } from 'react-i18next';
import styles from './styles/Island.module.css';
import { useOverlay } from './components/OverlayProvider';
import { motion } from 'motion/react';
import { TabPanels } from './components/TabPanels';
import { useIslandController } from './hooks/useIslandController';
import { useIslandGeometry } from './hooks/useIslandGeometry';
import { QuickView } from './components/QuickView';
import { BrowserSearchTab } from './features/BrowserSearchTab';
import { WorkflowsTab } from './features/WorkflowsTab';
import { OverviewTab } from './features/OverviewTab';
import { NowPlayingTab } from './features/NowPlayingTab';
import { AssistantTab } from './features/AssistantTab';
import { ClipboardTab } from './features/ClipboardTab';
import { TasksTab } from './features/TasksTab';
import { useCallback, useEffect, useState } from 'react';
import { recordIslandContext } from './lib/diagnostics';
export default function Island() {
  const { t } = useTranslation();
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
    syncWindowInputRegion,
    islandBorderEnabled,
    cameraInUse,
    microphoneInUse,
    charging,
    chargingAlert,
    percent,
    alert,
    bluetoothAlert,
    currentTabId,
    visibleTabs,
    selectTab,
    direction,
    trackPointerPosition,
  } = controller;
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
  const animatedHeight =
    mode === 'large' && currentTab === 4 && controller.asked
      ? Math.min(Math.max(height, window.innerHeight - 80), Math.max(height, assistantAnswerHeight))
      : height;
  const geometry = useIslandGeometry({
    width,
    height: animatedHeight,
    expanded: mode === 'large',
    tab: currentTab,
    getTabSize: (id) => {
      const size = controller.getExpandedTabSize(id);
      return {
        ...size,
        height:
          id === 4 && controller.asked
            ? Math.min(
                Math.max(size.height, window.innerHeight - 80),
                Math.max(size.height, assistantAnswerHeight),
              )
            : size.height,
      };
    },
  });
  const { width: visualWidth, height: visualHeight, radius, cornerK, fallbackRadius } = geometry;
  useEffect(() => {
    let frame: number | undefined;
    const sync = () => {
      if (frame !== undefined) return;
      frame = requestAnimationFrame(() => {
        frame = undefined;
        syncWindowInputRegion();
      });
    };
    const stopWidth = visualWidth.on('change', sync);
    const stopHeight = visualHeight.on('change', sync);
    const stopRadius = radius.on('change', sync);
    const stopCorner = cornerK.on('change', sync);
    return () => {
      stopWidth();
      stopHeight();
      stopRadius();
      stopCorner();
      if (frame !== undefined) cancelAnimationFrame(frame);
    };
  }, [visualWidth, visualHeight, radius, cornerK, syncWindowInputRegion]);
  const handleTabProgress = (from: number, to: number, progress: number, moving: boolean) => {
    geometry.followTabs(from, to, progress, moving);
    syncWindowInputRegion();
  };
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
      }}
      onUpdate={syncWindowInputRegion}
      onAnimationComplete={() => {
        syncWindowInputRegion();
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
        width: visualWidth,
        height: visualHeight,
        backgroundImage: controller.backgroundImageStyle,
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
          '--island-radius': radius,
          '--island-corner-k': cornerK,
          '--island-fallback-radius': fallbackRadius,
        } as import('motion/react').MotionStyle),
      }}
    >
      <div className={styles.content}>
        {/*Quickview*/}
        <QuickView {...controller} />

        {mode === 'large' && (
          <TabPanels
            tabs={visibleTabs}
            activeId={currentTabId}
            width={visualWidth}
            direction={direction}
            disabled={isOverlayOpen}
            onProgress={handleTabProgress}
            onSelect={selectTab}
            renderTab={(tab) => (
              <>
                {/*Browser Search*/}
                {tab === 0 && <BrowserSearchTab {...controller} />}
                {/* Workflows & Quick Apps */}
                {tab === 1 && <WorkflowsTab {...controller} />}

                {/*Overview tab*/}
                {tab === 2 && <OverviewTab {...controller} />}

                {/* Now Playing*/}
                {tab === 3 && <NowPlayingTab {...controller} />}

                {/* AI tab container */}
                {tab === 4 && (
                  <AssistantTab
                    {...controller}
                    onAnswerContentSizeChange={setAssistantAnswerHeight}
                    resetAnswerContentSize={resetAssistantAnswerHeight}
                  />
                )}

                {/*Clipboard*/}
                {tab === 5 && <ClipboardTab {...controller} />}

                {/*Tasks*/}
                {tab === 6 && <TasksTab {...controller} />}

                {/* Settings opens the dedicated window; the tab stays as the entry. */}
                {tab === 7 && (
                  <div className={styles.settingsLaunch}>
                    <button
                      type="button"
                      className={styles.settingsLaunchButton}
                      onClick={() => void window.electronAPI.openSettings()}
                    >
                      {t('openSettings')}
                    </button>
                  </div>
                )}
              </>
            )}
          />
        )}
        <div ref={setContainer} data-island-overlay className={styles.overlay} />
      </div>
    </motion.div>
  );
}
