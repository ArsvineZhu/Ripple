import styles from './styles/Island.module.css';
import { useOverlay } from './components/OverlayProvider';
import { motion } from 'motion/react';
import { AnimatePresence } from 'motion/react';
import { useIslandController } from './hooks/useIslandController';
import { QuickView } from './components/QuickView';
import { BrowserSearchTab } from './features/BrowserSearchTab';
import { WorkflowsTab } from './features/WorkflowsTab';
import { OverviewTab } from './features/OverviewTab';
import { NowPlayingTab } from './features/NowPlayingTab';
import { AssistantTab } from './features/AssistantTab';
import { ClipboardTab } from './features/ClipboardTab';
import { TasksTab } from './features/TasksTab';
import { SettingsTab } from './features/SettingsTab';
import { useCallback, useState } from 'react';
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
    direction,
    currentTabId,
    tabVariants,
    trackPointerPosition,
  } = controller;
  const animatedHeight =
    mode === 'large' && currentTab === 4 && controller.asked
      ? Math.min(Math.max(height, window.innerHeight - 80), Math.max(height, assistantAnswerHeight))
      : height;
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
        width: `${width}px`,
        height: `${animatedHeight}px`,
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

      <AnimatePresence custom={direction} mode="popLayout">
        {mode === 'large' && (
          <motion.div
            key={currentTabId}
            custom={direction}
            variants={tabVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 400, damping: 40 },
              opacity: { duration: 0.15 },
            }}
            className={styles.tabPanel}
          >
            {/*Browser Search*/}
            {currentTab === 0 && <BrowserSearchTab {...controller} />}
            {/* Workflows & Quick Apps */}
            {currentTab === 1 && <WorkflowsTab {...controller} />}

            {/*Overview tab*/}
            {currentTab === 2 && <OverviewTab {...controller} />}

            {/* Now Playing*/}
            {currentTab === 3 && <NowPlayingTab {...controller} />}

            {/* AI tab container */}
            {currentTab === 4 && (
              <AssistantTab
                {...controller}
                onAnswerContentSizeChange={setAssistantAnswerHeight}
                resetAnswerContentSize={resetAssistantAnswerHeight}
              />
            )}

            {/*Clipboard*/}
            {currentTab === 5 && <ClipboardTab {...controller} />}

            {/*Tasks*/}
            {currentTab === 6 && <TasksTab {...controller} />}

            {/*Settings Overhaul*/}
            {currentTab === 7 && <SettingsTab {...controller} />}
          </motion.div>
        )}
      </AnimatePresence>
      <div ref={setContainer} data-island-overlay className={styles.overlay} />
    </motion.div>
  );
}
