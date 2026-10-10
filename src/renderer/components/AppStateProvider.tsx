import { normalizeHiddenTabs } from '../../shared/appState';
import type { AppState, AppStatePatch } from '../../shared/appState';
import { noticeAreaForPatch } from '../../shared/contracts';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useNotifications } from './NotificationProvider';

interface AppStateContextValue {
  state: AppState;
  updateState(patch: AppStatePatch): void;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({
  initialState,
  children,
}: {
  initialState: AppState;
  children?: ReactNode;
}) {
  const [state, setState] = useState(() => ({
    ...initialState,
    settings: {
      ...initialState.settings,
      hiddenTabs: normalizeHiddenTabs(initialState.settings.hiddenTabs),
    },
  }));
  const { notify } = useNotifications();
  const updateState = useCallback(
    (patch: AppStatePatch) => {
      const normalizedPatch = patch.settings?.hiddenTabs
        ? {
            ...patch,
            settings: {
              ...patch.settings,
              hiddenTabs: normalizeHiddenTabs(patch.settings.hiddenTabs),
            },
          }
        : patch;
      setState((current) => ({
        ...current,
        ...normalizedPatch,
        settings: { ...current.settings, ...normalizedPatch.settings },
      }));
      void window.electronAPI?.updateAppState?.(normalizedPatch)?.catch((error: unknown) => {
        notify({
          severity: 'error',
          code: 'stateSaveFailed',
          area: noticeAreaForPatch(normalizedPatch),
          detail: error instanceof Error ? error.message : String(error),
        });
      });
    },
    [notify],
  );
  useEffect(() => {
    return window.electronAPI?.onAppStateChanged?.((next) => {
      setState({
        ...next,
        settings: {
          ...next.settings,
          hiddenTabs: normalizeHiddenTabs(next.settings.hiddenTabs),
        },
      });
    });
  }, []);
  const value = useMemo(() => ({ state, updateState }), [state, updateState]);
  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) throw new Error('AppStateProvider is missing');
  return context;
}
