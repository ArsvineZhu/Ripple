import type { ElectronAPI, InvokeMap } from '../shared/contracts';
import { contextBridge, ipcRenderer } from 'electron';

function invoke<K extends keyof InvokeMap>(
  channel: K,
  ...args: InvokeMap[K]['args']
): Promise<InvokeMap[K]['result']> {
  return ipcRenderer.invoke(channel, ...args);
}
const api: ElectronAPI = {
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
  searchApps: (query) => invoke('search-apps', query),
  getDisplays: () => invoke('get-displays'),
  setDisplay: (displayId) => invoke('set-display', displayId),
  setAutoLaunch: (enable) =>
    process.platform !== 'darwin' ? invoke('set-auto-launch', enable) : Promise.resolve(),
  focusWindow: () => invoke('focus-window'),
  platform: process.platform,
};
contextBridge.exposeInMainWorld('electronAPI', api);
