import { useTranslation } from 'react-i18next';
import { useIslandInteraction } from './useIslandInteraction';
import { useEffect, useReducer } from 'react';

import { measureTextWidth } from '../lib/text';
import { storage } from '../lib/storage';
import { useAssistant } from './useAssistant';
import { useTasks } from './useTasks';
import { useWorkflows } from './useWorkflows';
import { useQuickApps } from './useQuickApps';
import { useBrowserSearch } from './useBrowserSearch';
import { useClipboard } from './useClipboard';
import { useOverview } from './useOverview';
import { useBattery } from './useBattery';
import { useBatteryAlerts } from './useBatteryAlerts';
import { useDeviceAlerts } from './useDeviceAlerts';
import { useMedia } from './useMedia';
import { useSettingsContext } from '../components/SettingsProvider';
import { modeReducer, resolveMode } from '../lib/modes';
import { useNavigation } from './useNavigation';
import { useWindowInput } from './useWindowInput';
export function useIslandController() {
  const { t } = useTranslation();
  const [requestedMode, setMode] = useReducer(modeReducer, 'still');
  const {
    batteryAlertsEnabled,
    islandBorderEnabled,
    standbyBorderEnabled,
    largeStandbyEnabled,
    hideNotActiveIslandEnabled,
    showInfoWhenIdleEnabled,
    hourFormat,
    weatherUnit,
    theme,
    setTheme,
    bgColor,
    textColor,
    bgImage,
    displays,
    setDisplays,
    currentDisplayId,
    weatherLocation,
    setWeatherLocation,
    autoLaunchEnabled,
    positionMode,
    setPositionMode,
    islandX,
    islandY,
    handleBatteryAlertsChange,
    handleIslandBorderChange,
    handleStandbyChange,
    handleLargeStandbyChange,
    handleHourFormatChange,
    handleAutoLaunchChange,
    handlehideNotActiveIslandChange,
    handleShowInfoWhenIdleChange,
    handleWeatherUnitChange,
    handleBgColorChange,
    handleTextColorChange,
    handleDisplayChange,
    handleIslandXChange,
    handleIslandYChange,
    savePosition,
    handleBgImageChange,
  } = useSettingsContext();
  const mode = resolveMode(requestedMode, standbyBorderEnabled, largeStandbyEnabled);
  const {
    spotifyTrack,
    albumHovered,
    setAlbumHovered,
    albumRotation,
    setAlbumRotation,
    showPausedQuickView,
    albumRef,
  } = useMedia();
  const {
    isHovered,
    setIsHovered,
    isDragging,
    updateDragging,
    beginPositionChange,
    finishPositionChange,
    leave,
    isOverlayOpen,
  } = useIslandInteraction({
    setMode,
    standby: standbyBorderEnabled,
    largeStandby: largeStandbyEnabled,
  });
  const handlePositionChange = (value: string) => {
    if (value === positionMode) return;
    beginPositionChange();
    setPositionMode(value);
    storage.setItem('position-mode', value);
  };
  const {
    asked,
    setAsked,
    aiAnswer,
    assistantError,
    setAIAnswer,
    userText,
    setUserText,
    aiProvider,
    setAiProvider,
    aiModel,
    setAiModel,
    askAI,
  } = useAssistant();
  const { tasks, taskText, setTaskText, addTask, removeTask } = useTasks();
  const {
    workflows,
    workflowName,
    setWorkflowName,
    workflowUrls,
    setWorkflowUrls,
    openWorkflow,
    addWorkflow,
    removeWorkflow,
  } = useWorkflows();
  const {
    quickApps,
    newQuickApp,
    handleQuickAppInput,
    selectQuickApp,
    appSuggestions,
    showSuggestions,
    setShowSuggestions,
    handleQaChange,
    addQuickApp,
    removeQuickApp,
  } = useQuickApps();
  const { browserSearch, setBrowserSearch, searchBrowser } = useBrowserSearch();
  const { clipboard, copyToClipboard } = useClipboard();
  const { time, weather } = useOverview(hourFormat);
  const { percent, charging } = useBattery();
  const { alert, chargingAlert } = useBatteryAlerts({ percent, charging, setMode });
  const { bluetoothAlert, cameraInUse, cameraAlert, microphoneInUse, microphoneAlert } =
    useDeviceAlerts(setMode);
  const {
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
  } = useNavigation({ spotifyTrack, mode, isDragging, setMode });
  const { islandElementRef, syncLinuxWindowShape } = useWindowInput();
  let isPlaying = spotifyTrack?.state === 'playing';
  const trackTitle = spotifyTrack ? spotifyTrack.name || t('unknownSong') : '';
  const trackArtist = spotifyTrack ? spotifyTrack.artist || t('unknownArtist') : '';
  const nowPlayingText = spotifyTrack ? `${trackTitle} • ${trackArtist}` : '';
  const textWidth = measureTextWidth(nowPlayingText) || nowPlayingText.length * 7;
  const nowPlayingWidth = Math.min(300, Math.max(122, Math.ceil(textWidth + 24 + 6 + 20)));
  let width =
    mode === 'large'
      ? currentTab === 7
        ? 495
        : currentTab === 1
          ? 480
          : currentTab === 3
            ? 330
            : currentTab === 0
              ? 405
              : 380
      : mode === 'quick' &&
          isPlaying &&
          !alert &&
          !chargingAlert &&
          !bluetoothAlert &&
          !cameraAlert &&
          !microphoneAlert
        ? nowPlayingWidth
        : mode === 'quick' ||
            alert ||
            chargingAlert ||
            bluetoothAlert ||
            cameraAlert ||
            microphoneAlert
          ? 260
          : isPlaying
            ? nowPlayingWidth
            : 170;
  let height =
    mode === 'large'
      ? currentTab === 7
        ? positionMode === 'free'
          ? 425
          : 345
        : currentTab === 6
          ? 250
          : currentTab === 3
            ? 150
            : currentTab === 0
              ? 120
              : currentTab === 1
                ? 210
                : 190
      : 40;
  useEffect(() => {
    const savedDisplayId = storage.getItem('display-id');
    if (savedDisplayId && window.electronAPI?.setDisplay) {
      window.electronAPI.setDisplay(savedDisplayId);
    }

    if (!storage.getItem('newuser')) {
      storage.setItem('newuser', 'true');
    }

    if (storage.getItem('newuser') === 'true') {
      const timer = setTimeout(() => {
        void window.electronAPI.openExternal(
          'https://github.com/ArsvineZhu/Ripple/blob/main/instructions.md',
        );
        storage.setItem('newuser', 'false');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);
  useEffect(() => {
    if (currentTab === 7 && window.electronAPI?.getDisplays) {
      window.electronAPI.getDisplays().then(setDisplays);
    }
  }, [currentTab, setDisplays]);

  const handleDragEndChecks = () => {
    updateDragging(false);
    clearClickSuppression();
  };
  const isFree = positionMode === 'free';
  const getSideStyles = () => {
    switch (positionMode) {
      case 'top-left':
        return { left: '15px', top: '15px', x: '0%' };
      case 'top-right':
        return { left: 'calc(100% - 15px)', top: '15px', x: '-100%' };
      case 'bottom-left':
        return { left: '15px', top: 'auto', bottom: '45px', x: '0%' };
      case 'bottom-right':
        return { left: 'calc(100% - 15px)', top: 'auto', bottom: '45px', x: '-100%' };
      case 'top-center':
        return { left: '49.8%', top: '20px', x: '-50%' };
      case 'bottom-center':
        return { left: '49.8%', top: 'auto', bottom: '45px', x: '-50%' };
      default:
        return { left: `${islandX}%`, top: `${islandY}px`, x: '-50%' };
    }
  };
  const sideStyles = getSideStyles();
  return {
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
    standbyBorderEnabled,
    largeStandbyEnabled,
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
    showPausedQuickView,
    cameraAlert,
    microphoneAlert,
    spotifyTrack,
    trackTitle,
    trackArtist,
    setAlbumHovered,
    setAlbumRotation,
    albumRotation,
    albumHovered,
    textWidth,
    nowPlayingWidth,
    time,
    weather,
    direction,
    currentTabId,
    tabVariants,
    browserSearch,
    setBrowserSearch,
    searchBrowser,
    workflows,
    openWorkflow,
    quickApps,
    albumRef,
    asked,
    userText,
    setUserText,
    setAsked,
    askAI,
    aiAnswer,
    assistantError,
    setAIAnswer,
    clipboard,
    copyToClipboard,
    tasks,
    removeTask,
    taskText,
    setTaskText,
    addTask,
    hourFormat,
    handleHourFormatChange,
    autoLaunchEnabled,
    handleAutoLaunchChange,
    displays,
    currentDisplayId,
    handleDisplayChange,
    tabOrder,
    hiddenTabs,
    moveTabOrder,
    setDefaultTabId,
    defaultTabId,
    toggleTabVisibility,
    setTheme,
    positionMode,
    handlePositionChange,
    isFree,
    islandX,
    updateDragging,
    handleIslandXChange,
    savePosition,
    handleDragEndChecks,
    islandY,
    handleIslandYChange,
    handleIslandBorderChange,
    handlehideNotActiveIslandChange,
    handleBgColorChange,
    handleTextColorChange,
    handleBgImageChange,
    batteryAlertsEnabled,
    handleBatteryAlertsChange,
    handleStandbyChange,
    handleLargeStandbyChange,
    handleShowInfoWhenIdleChange,
    weatherLocation,
    setWeatherLocation,
    weatherUnit,
    handleWeatherUnitChange,
    newQuickApp,
    handleQuickAppInput,
    selectQuickApp,
    setShowSuggestions,
    addQuickApp,
    showSuggestions,
    appSuggestions,
    handleQaChange,
    removeQuickApp,
    aiProvider,
    setAiProvider,
    setAiModel,
    aiModel,
    workflowName,
    setWorkflowName,
    workflowUrls,
    setWorkflowUrls,
    addWorkflow,
    removeWorkflow,
  };
}
export type IslandController = ReturnType<typeof useIslandController>;
