import path from 'node:path';
import { app, BrowserWindow } from 'electron';
import { getIconPath } from './assets';
import type { DiagnosticsService } from './services/diagnostics';
import { attachWindowDiagnostics } from './services/windowDiagnostics';
import { registerWindowRole } from './windowRoles';

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string;

let settingsWindow: BrowserWindow | null = null;
let configured: {
  diagnostics: DiagnosticsService;
  onLoadError: (error: unknown) => void;
} | null = null;

export function configureSettingsWindow(options: {
  diagnostics: DiagnosticsService;
  onLoadError: (error: unknown) => void;
}): void {
  configured = options;
}

export function getSettingsWindow(): BrowserWindow | null {
  return settingsWindow;
}

/**
 * LuLu makeActive: regular policy first, then show the window, then strong activation.
 * Do not call dock.show()/hide(); setActivationPolicy alone drives the Dock tile.
 */
function presentSettingsWindow(window: BrowserWindow): void {
  if (process.platform === 'darwin') app.setActivationPolicy('regular');
  if (window.isMinimized()) window.restore();
  window.show();
  window.focus();
  if (process.platform === 'darwin') {
    app.focus({ steal: true });
    window.moveTop();
  }
}

/** LuLu closeWindow path for Ripple: only Settings closing returns to accessory (Island stays up). */
function onSettingsWindowClosed(): void {
  if (process.platform === 'darwin') app.setActivationPolicy('accessory');
}

/**
 * Attach an existing BrowserWindow as the settings window (tests and step-1 seam).
 * Production code should call openSettingsWindow() instead.
 */
export function attachSettingsWindow(window: BrowserWindow): void {
  settingsWindow = window;
  registerWindowRole(window.webContents, 'settings');
  window.on('closed', () => {
    if (settingsWindow === window) settingsWindow = null;
    onSettingsWindowClosed();
  });
}

/** Test seam: drop the attached settings window without destroying it. */
export function clearSettingsWindow(): void {
  settingsWindow = null;
}

/** One settings window: create on demand, focus if it already exists, destroy on close. */
export function openSettingsWindow(): BrowserWindow {
  if (!configured) throw new Error('Settings window is not configured');
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    presentSettingsWindow(settingsWindow);
    return settingsWindow;
  }

  const { diagnostics, onLoadError } = configured;
  if (process.platform === 'darwin') app.setActivationPolicy('regular');
  const window = new BrowserWindow({
    width: 720,
    height: 800,
    minWidth: 520,
    minHeight: 480,
    show: false,
    autoHideMenuBar: true,
    title: 'Ripple Next',
    backgroundColor: '#111111',
    // Settings is a normal window: on the taskbar while open, never click-through.
    skipTaskbar: false,
    icon: getIconPath(),
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.cjs'),
      devTools: false,
      backgroundThrottling: true,
    },
  });
  settingsWindow = window;
  registerWindowRole(window.webContents, 'settings');
  attachWindowDiagnostics(window, diagnostics);
  diagnostics.record({
    kind: 'window-lifecycle',
    event: 'created',
    windowId: window.id,
    webContentsId: window.webContents.id,
  });

  window.once('ready-to-show', () => {
    if (!window.isDestroyed()) presentSettingsWindow(window);
  });
  window.on('closed', () => {
    if (settingsWindow === window) settingsWindow = null;
    onSettingsWindowClosed();
  });

  const devServerUrl =
    typeof MAIN_WINDOW_VITE_DEV_SERVER_URL === 'undefined'
      ? undefined
      : MAIN_WINDOW_VITE_DEV_SERVER_URL;
  const viteName =
    typeof MAIN_WINDOW_VITE_NAME === 'undefined' ? 'main_window' : MAIN_WINDOW_VITE_NAME;
  if (devServerUrl) {
    void window.loadURL(`${devServerUrl}#settings`).catch(onLoadError);
  } else {
    const rendererPath = path.join(__dirname, `../renderer/${viteName}/index.html`);
    void window.loadFile(rendererPath, { hash: 'settings' }).catch(onLoadError);
  }
  return window;
}
