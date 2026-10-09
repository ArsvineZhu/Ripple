import type { AppNotice, AssistantEvent, ElectronAPI, InvokeMap } from '../shared/contracts';
import { ScrollGestureStartSchema } from '../shared/contracts';
import { contextBridge, ipcRenderer } from 'electron';

function invoke<K extends keyof InvokeMap>(
  channel: K,
  ...args: InvokeMap[K]['args']
): Promise<InvokeMap[K]['result']> {
  return ipcRenderer.invoke(channel, ...args);
}
const api: ElectronAPI = {
  openDiagnosticsFolder: () => invoke('open-diagnostics-folder'),
  readClipboardText: () => invoke('read-clipboard-text'),
  writeClipboardText: (text) => invoke('write-clipboard-text', text),
  getSystemLocale: () => invoke('get-system-locale'),
  setUILocale: (locale) => invoke('set-ui-locale', locale),
  getAppBootstrap: () => invoke('get-app-bootstrap'),
  updateAppState: (patch) => invoke('update-app-state', patch),
  saveApiKey: (key) => invoke('save-api-key', key),
  launchQuickApp: (id) => invoke('launch-quick-app', id),
  discoverApps: (query) => invoke('discover-apps', query),
  rendererReady: () => invoke('renderer-ready'),
  startAssistant: (requestId, prompt) => invoke('start-assistant', requestId, prompt),
  cancelAssistant: (requestId) => invoke('cancel-assistant', requestId),
  onAppNotice: (callback: (notice: AppNotice) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, notice: AppNotice) => callback(notice);
    ipcRenderer.on('app-notice', listener);
    return () => ipcRenderer.removeListener('app-notice', listener);
  },
  onAssistantEvent: (callback: (event: AssistantEvent) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, payload: AssistantEvent) =>
      callback(payload);
    ipcRenderer.on('assistant-event', listener);
    return () => ipcRenderer.removeListener('assistant-event', listener);
  },
  onScrollGestureStart: (callback) => {
    const listener = (_event: Electron.IpcRendererEvent, payload: unknown) => {
      const result = ScrollGestureStartSchema.safeParse(payload);
      if (result.success) callback(result.data);
    };
    ipcRenderer.on('scroll-gesture-start', listener);
    return () => ipcRenderer.removeListener('scroll-gesture-start', listener);
  },
  setIgnoreMouseEvents: (ignore, forward) => {
    return invoke('set-ignore-mouse-events', ignore, forward);
  },
  setWindowInputShape: (rect) => ipcRenderer.send('set-window-input-shape', rect),
  getSystemMedia: () => invoke('get-system-media'),
  getBluetoothStatus: () => invoke('get-bluetooth-status'),
  getCameraStatus: () => invoke('get-camera-status'),
  getMicrophoneStatus: () => invoke('get-microphone-status'),
  controlSystemMedia: (command) => invoke('control-system-media', command),
  openExternal: (url) => invoke('open-external', url),
  launchApp: (appName) => invoke('launch-app', appName),
  buildAppCache: () => invoke('build-app-cache'),
  getDisplays: () => invoke('get-displays'),
  setDisplay: (displayId) => invoke('set-display', displayId),
  setAutoLaunch: (enable) => invoke('set-auto-launch', enable),
  focusWindow: () => invoke('focus-window'),
  platform: process.platform,
};
contextBridge.exposeInMainWorld('electronAPI', api);
