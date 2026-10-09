import type { BrowserWindow } from 'electron';
import { registerWindowRole } from './windowRoles';

let settingsWindow: BrowserWindow | null = null;

export function getSettingsWindow(): BrowserWindow | null {
  return settingsWindow;
}

/**
 * Attach a BrowserWindow as the settings window and register its IPC role.
 * Step 2 will create the real window; step 1 only needs the registration seam.
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
