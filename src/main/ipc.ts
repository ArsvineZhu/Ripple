import { app } from 'electron';
import { isLocale } from '../shared/i18n';
import { setTrayLocale } from './tray';
import type { InputRect } from '../shared/contracts';
import { ipcMain, screen, shell } from 'electron';
import type { InvokeMap } from '../shared/contracts';
import { applyLinuxInputShape, getMainWindow, showMainWindow } from './window';
import { launchApp, buildAppCache, searchApps } from './services/apps';
import { setAutoLaunch } from './services/autostart';
import { getSystemMedia } from './services/getSystemMedia';
import { getBluetoothStatus } from './services/getBluetoothStatus';
import { getCameraStatus } from './services/getCameraStatus';
import { getMicrophoneStatus } from './services/getMicrophoneStatus';
import { controlSystemMedia } from './services/mediaControl';
function handle<K extends keyof InvokeMap>(
  channel: K,
  listener: (
    ...args: InvokeMap[K]['args']
  ) => InvokeMap[K]['result'] | Promise<InvokeMap[K]['result']>,
) {
  ipcMain.handle(channel, (event, ...args: unknown[]) => {
    if (event.sender !== getMainWindow()?.webContents) throw new Error('Unknown IPC sender');
    return listener(...(args as InvokeMap[K]['args']));
  });
}
function text(value: string) {
  if (typeof value !== 'string') throw new TypeError('Expected string');
  return value;
}
export function registerIPC() {
  handle('get-system-locale', () => app.getLocale());
  handle('set-ui-locale', (locale) => {
    if (!isLocale(locale)) throw new TypeError('Invalid locale');
    setTrayLocale(locale);
  });
  handle('set-ignore-mouse-events', (ignore, forward) => {
    const window = getMainWindow();
    if (process.platform !== 'linux' && window)
      window.setIgnoreMouseEvents(Boolean(ignore), { forward: Boolean(forward) });
  });
  ipcMain.on('set-window-input-shape', (event, rect: InputRect) => {
    if (event.sender !== getMainWindow()?.webContents || !rect) return;
    if (
      ![rect.x, rect.y, rect.width, rect.height, rect.scaleFactor].every(Number.isFinite) ||
      rect.width <= 0 ||
      rect.height <= 0 ||
      rect.scaleFactor <= 0
    )
      return;
    try {
      applyLinuxInputShape(rect);
    } catch (error) {
      console.error('Failed to set Linux window input shape:', error);
    }
  });
  handle('focus-window', () => {
    getMainWindow()?.focus();
  });
  handle('open-external', async (url) => {
    await shell.openExternal(text(url));
  });
  handle('launch-app', (name) => launchApp(text(name)));
  handle('build-app-cache', buildAppCache);
  handle('search-apps', (query) => searchApps(text(query)));
  handle('get-system-media', getSystemMedia);
  handle('get-bluetooth-status', getBluetoothStatus);
  handle('get-camera-status', getCameraStatus);
  handle('get-microphone-status', getMicrophoneStatus);
  handle('control-system-media', (command) => {
    if (!['previous', 'playpause', 'next'].includes(command))
      throw new TypeError('Invalid media command');
    controlSystemMedia(command);
  });
  handle('get-displays', () =>
    screen
      .getAllDisplays()
      .map((d) => ({ id: d.id, label: d.label || `Display ${d.id}`, bounds: d.bounds })),
  );
  handle('set-display', (id) => {
    if (typeof id !== 'string' && typeof id !== 'number') throw new TypeError('Invalid display');
    const target =
      screen.getAllDisplays().find((d) => String(d.id) === String(id)) ||
      screen.getPrimaryDisplay();
    getMainWindow()?.setBounds(target.bounds);
    showMainWindow();
  });
  handle('set-auto-launch', (enable) => {
    if (typeof enable !== 'boolean') throw new TypeError('Expected boolean');
    setAutoLaunch(enable);
  });
}
