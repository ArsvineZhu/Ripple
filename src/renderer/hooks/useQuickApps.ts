import { useState, useEffect, useRef } from 'react';

import type { AppEntry } from '../../shared/contracts';

import { storage } from '../lib/storage';
export function useQuickApps() {
  const normalizeApps = (arr: (string | AppEntry)[]) =>
    arr.map((a) => (typeof a === 'string' ? { name: a, launch: a } : a));
  const [quickApps, setQuickApps] = useState(() =>
    normalizeApps(storage.read('quick-apps', ['Notes', 'Spotify', 'Calculator', 'Terminal'])),
  );
  const [newQuickApp, setNewQuickApp] = useState('');
  const [appSuggestions, setAppSuggestions] = useState<AppEntry[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const selectedAppRef = useRef<AppEntry | null>(null);
  const appSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (window.electronAPI?.platform === 'win32') {
      window.electronAPI?.buildAppCache?.();
    }
  }, []);
  const handleQaChange = (index: number, value: string) => {
    const updatedApps = [...quickApps];
    updatedApps[index] = { name: value, launch: value };
    setQuickApps(updatedApps);
    storage.setItem('quick-apps', JSON.stringify(updatedApps));
  };
  const addQuickApp = () => {
    if (newQuickApp.trim()) {
      const entry = selectedAppRef.current || {
        name: newQuickApp.trim(),
        launch: newQuickApp.trim(),
      };
      const updatedApps = [...quickApps, entry];
      setQuickApps(updatedApps);
      storage.setItem('quick-apps', JSON.stringify(updatedApps));
      setNewQuickApp('');
      selectedAppRef.current = null;
      setShowSuggestions(false);
    }
  };
  const removeQuickApp = (index: number) => {
    const updatedApps = quickApps.filter((_, i) => i !== index);
    setQuickApps(updatedApps);
    storage.setItem('quick-apps', JSON.stringify(updatedApps));
  };
  const handleQuickAppInput = (value: string) => {
    setNewQuickApp(value);
    selectedAppRef.current = null;
    if (appSearchTimer.current) clearTimeout(appSearchTimer.current);
    if (window.electronAPI?.platform === 'win32' && value.trim().length > 1) {
      appSearchTimer.current = setTimeout(() => {
        void window.electronAPI.searchApps(value.trim()).then((results) => {
          setAppSuggestions(results);
          setShowSuggestions(results.length > 0);
        });
      }, 200);
    } else {
      setAppSuggestions([]);
      setShowSuggestions(false);
    }
  };
  const selectQuickApp = (entry: AppEntry) => {
    selectedAppRef.current = entry;
    setNewQuickApp(entry.name);
    setShowSuggestions(false);
  };
  useEffect(
    () => () => {
      if (appSearchTimer.current) clearTimeout(appSearchTimer.current);
    },
    [],
  );
  return {
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
  };
}
