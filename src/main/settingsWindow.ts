import path from 'node:path';
import { BrowserWindow } from 'electron';
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
 * Attach an existing BrowserWindow as the settings window (tests and step-1 seam).
 * Production code should call openSettingsWindow() instead.
 */
export function attachSettingsWindow(window: BrowserWindow): void {
  settingsWindow = window;
  registerWindowRole(window.webContents, 'settings');
  window.on('closed', () => {
    if (settingsWindow === window) settingsWindow = null;
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
    if (settingsWindow.isMinimized()) settingsWindow.restore();
    settingsWindow.show();
    settingsWindow.focus();
    return settingsWindow;
  }

  const { diagnostics, onLoadError } = configured;
  const window = new BrowserWindow({
    width: 720,
    height: 800,
    minWidth: 520,
    minHeight: 480,
    show: false,
    autoHideMenuBar: true,
    title: 'Ripple Next',
    backgroundColor: '#111111',
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
    if (!window.isDestroyed()) {
      window.show();
      window.focus();
    }
  });
  window.on('closed', () => {
    if (settingsWindow === window) settingsWindow = null;
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
