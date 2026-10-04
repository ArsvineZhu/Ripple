import type { AppEntry, Workflow } from '../../shared/contracts';

type StorageKey =
  | 'ai-model'
  | 'ai-provider'
  | 'api-key'
  | 'auto-launch'
  | 'battery-alerts'
  | 'bg-color'
  | 'bg-image'
  | 'default-tab'
  | 'display-id'
  | 'hidden-tabs'
  | 'hide-island-notactive'
  | 'hour-format'
  | 'island-border'
  | 'island-x'
  | 'island-y'
  | 'large-standby-mode'
  | 'location'
  | 'newuser'
  | 'position-mode'
  | 'quick-apps'
  | 'show-info-when-idle'
  | 'side-mode'
  | 'standby-mode'
  | 'tab-order'
  | 'tasks'
  | 'text-color'
  | 'weather-unit'
  | 'workflows';
interface Collections {
  'tab-order': number[];
  'hidden-tabs': number[];
  tasks: string[];
  workflows: Workflow[];
  'quick-apps': (string | AppEntry)[];
}
export function createStorage(backend: Pick<Storage, 'getItem' | 'setItem'>) {
  return {
    getItem: (key: StorageKey) => backend.getItem(key),
    setItem: (key: StorageKey, value: string | number) => backend.setItem(key, String(value)),
    read<K extends keyof Collections>(key: K, fallback: Collections[K]): Collections[K] {
      const raw = backend.getItem(key);
      if (raw === null) return fallback;
      try {
        const value: unknown = JSON.parse(raw);
        return Array.isArray(value) ? (value as Collections[K]) : fallback;
      } catch {
        return fallback;
      }
    },
  };
}
export const storage = createStorage({
  getItem: (key) => localStorage.getItem(key),
  setItem: (key, value) => localStorage.setItem(key, value),
});
