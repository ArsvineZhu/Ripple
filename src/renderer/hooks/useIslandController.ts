import { useTranslation } from 'react-i18next';
import { useIslandInteraction } from './useIslandInteraction';
import { useEffect, useLayoutEffect, useReducer, useState } from 'react';

import { measureTextWidth } from '../lib/text';
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
import { useAppState } from '../components/AppStateProvider';
import { expandedTabSize } from '../lib/tabGeometry';
import { useBackgroundImage } from './useBackgroundImage';
export function useIslandController() {
  const { t } = useTranslation();
  const { state: appState, updateState } = useAppState();
  const [requestedMode, setMode] = useReducer(modeReducer, 'still');
  const [settingsContentWidth, setSettingsContentWidth] = useState<number | null>(null);
  const {
    batteryAlertsEnabled,
    islandBorderEnabled,
    standbyBorderEnabled,
    largeStandbyEnabled,
    hideNotActiveIslandEnabled,
    showInfoWhenIdleEnabled,
    leaveDelayMs,
    hasApiKey,
    aiBaseUrl,
    aiModel,
    saveApiKey,
    searchUrlTemplate,
    setSearchUrlTemplate,
    handleApiBaseUrlChange,
    handleAiModelChange,
    handleLeaveDelayChange,
    hourFormat,
    timeZone,
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
    handleTimeZoneChange,
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
  const backgroundImage = useBackgroundImage(bgImage);
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
    setAssistantActive,
    leave,
    geometryExited,
    isOverlayOpen,
  } = useIslandInteraction({
    setMode,
    standby: standbyBorderEnabled,
    largeStandby: largeStandbyEnabled,
    leaveDelayMs,
  });
  const handlePositionChange = (value: string) => {
    if (value === positionMode) return;
    beginPositionChange();
    setPositionMode(value);
  };
  const {
    asked,
    setAsked,
    aiAnswer,
    assistantError,
    setAIAnswer,
    userText,
    setUserText,
    resetAssistant,
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
    quickAppMode,
    setQuickAppMode,
    executable,
    setExecutable,
    argumentLines,
    setArgumentLines,
    workingDirectory,
    setWorkingDirectory,
    appUrl,
    setAppUrl,
    handleQuickAppInput,
    selectQuickApp,
    appSuggestions,
    showSuggestions,
    setShowSuggestions,
    handleQaChange,
    addQuickApp,
    removeQuickApp,
  } = useQuickApps();
  const { browserSearch, setBrowserSearch, searchBrowser, searchError, setSearchError } =
    useBrowserSearch();
  const { clipboard, copyToClipboard } = useClipboard();
  const { time, weather } = useOverview(hourFormat, timeZone, weatherLocation, weatherUnit);
  const { percent, charging } = useBattery();
  const { alert, chargingAlert } = useBatteryAlerts({
    percent,
    charging,
    enabled: batteryAlertsEnabled,
    setMode,
  });
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
    visibleTabs,
    selectTab,
    clearClickSuppression,
    consumeClickSuppression,
    isInteractiveTarget,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  } = useNavigation({ spotifyTrack, mode, isDragging, setMode });
  useLayoutEffect(() => {
    setAssistantActive(currentTab === 4 && asked);
  }, [asked, currentTab, setAssistantActive]);
  const { islandElementRef, syncWindowInputRegion, trackPointerPosition } =
    useWindowInput(geometryExited);
  let isPlaying = spotifyTrack?.state === 'playing';
  const trackTitle = spotifyTrack ? spotifyTrack.name || t('unknownSong') : '';
  const trackArtist = spotifyTrack ? spotifyTrack.artist || t('unknownArtist') : '';
  const nowPlayingText = spotifyTrack ? `${trackTitle} • ${trackArtist}` : '';
  const textWidth = measureTextWidth(nowPlayingText) || nowPlayingText.length * 7;
  const nowPlayingWidth = Math.min(300, Math.max(122, Math.ceil(textWidth + 24 + 6 + 20)));
  const getExpandedTabSize = (id: number) =>
    expandedTabSize(id, settingsContentWidth, positionMode === 'free');
  const expandedSize = getExpandedTabSize(currentTab);
  let width =
    mode === 'large'
      ? expandedSize.width
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
  let height = mode === 'large' ? expandedSize.height : 40;
  useEffect(() => {
    const savedDisplayId = appState.settings.displayId;
    if (savedDisplayId && window.electronAPI?.setDisplay) {
      void window.electronAPI.setDisplay(savedDisplayId);
    }

    if (!appState.settings.welcomeShown) {
      const timer = setTimeout(() => {
        void window.electronAPI.openExternal(
          'https://github.com/ArsvineZhu/Ripple-Next/blob/main/instructions.md',
        );
        updateState({ settings: { welcomeShown: true } });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [appState.settings.displayId, appState.settings.welcomeShown, updateState]);
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
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    sideStyles,
    width,
    getExpandedTabSize,
    onSettingsContentWidthChange: setSettingsContentWidth,
    height,
    hideNotActiveIslandEnabled,
    bgColor,
    textColor,
    isHovered,
    theme,
    currentTab,
    syncWindowInputRegion,
    trackPointerPosition,
    bgImage,
    ...backgroundImage,
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
    visibleTabs,
    selectTab,
    browserSearch,
    setBrowserSearch,
    searchBrowser,
    searchError,
    setSearchError,
    searchUrlTemplate,
    setSearchUrlTemplate,
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
    resetAssistant,
    clipboard,
    copyToClipboard,
    tasks,
    removeTask,
    taskText,
    setTaskText,
    addTask,
    hourFormat,
    handleHourFormatChange,
    timeZone,
    handleTimeZoneChange,
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
    quickAppMode,
    setQuickAppMode,
    executable,
    setExecutable,
    argumentLines,
    setArgumentLines,
    workingDirectory,
    setWorkingDirectory,
    appUrl,
    setAppUrl,
    handleQuickAppInput,
    selectQuickApp,
    setShowSuggestions,
    addQuickApp,
    showSuggestions,
    appSuggestions,
    handleQaChange,
    removeQuickApp,
    aiBaseUrl,
    aiModel,
    hasApiKey,
    saveApiKey,
    handleApiBaseUrlChange,
    handleAiModelChange,
    leaveDelayMs,
    handleLeaveDelayChange,
    workflowName,
    setWorkflowName,
    workflowUrls,
    setWorkflowUrls,
    addWorkflow,
    removeWorkflow,
  };
}
export type IslandController = ReturnType<typeof useIslandController>;
