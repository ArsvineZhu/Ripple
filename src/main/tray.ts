import { messages, resolveLocale } from '../shared/i18n';
import type { Locale } from '../shared/i18n';
import { app, Menu, nativeImage, Tray } from 'electron';
import { getIconPath } from './assets';
import { getMainWindow, showMainWindow } from './window';
let tray: Tray | null = null;
export const hasTray = () => tray !== null;
let locale: Locale;
export function setTrayLocale(value: Locale) {
  locale = value;
  updateTrayMenu();
}
function updateTrayMenu() {
  if (!tray) return;
  const t = messages[locale];
  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: t.trayToggle,
        click: () => {
          const window = getMainWindow();
          if (window?.isVisible()) window.hide();
          else showMainWindow();
        },
      },
      { type: 'separator' },
      { label: t.quit, click: () => app.quit() },
    ]),
  );
}
export function createTray() {
  try {
    tray = new Tray(nativeImage.createFromPath(getIconPath()).resize({ width: 16, height: 16 }));
    tray.setToolTip('Ripple');
    locale = locale || resolveLocale('system', app.getLocale());
    updateTrayMenu();
  } catch (error) {
    console.error('Failed to create tray:', error);
  }
}
