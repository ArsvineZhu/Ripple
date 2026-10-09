import { useAppState } from '../components/AppStateProvider';
import { useSettingsContext } from '../components/SettingsProvider';
import { useBackgroundImage } from './useBackgroundImage';
import { useQuickApps } from './useQuickApps';
import { useWorkflows } from './useWorkflows';
import { normalizeHiddenTabs, SETTINGS_TAB_ID } from '../../shared/appState';
import { TABS } from '../lib/tabs';

/** Settings-window props for SettingsTab without island media, hover, or paging. */
export function useSettingsWindowController() {
  const { state, updateState } = useAppState();
  const settings = useSettingsContext();
  const backgroundImage = useBackgroundImage(settings.bgImage);
  const {
    workflows,
    workflowName,
    setWorkflowName,
    workflowUrls,
    setWorkflowUrls,
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
  const handlePositionChange = (value: string) => {
    if (value === settings.positionMode) return;
    settings.setPositionMode(value);
  };

  return {
    ...settings,
    ...backgroundImage,
    workflows,
    workflowName,
    setWorkflowName,
    workflowUrls,
    setWorkflowUrls,
    addWorkflow,
    removeWorkflow,
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
    tabOrder,
    hiddenTabs: normalizeHiddenTabs(hiddenTabs),
    defaultTabId,
    setDefaultTabId,
    moveTabOrder,
    toggleTabVisibility,
    handlePositionChange,
    isFree: settings.positionMode === 'free',
    // Position sliders no longer drive island drag state in the settings window.
    updateDragging: () => {},
    handleDragEndChecks: () => {},
  };
}
