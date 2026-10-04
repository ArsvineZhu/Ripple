import { app, Menu, nativeImage, Tray } from 'electron';
import { getIconPath } from './assets';
import { getMainWindow, showMainWindow } from './window';
let tray: Tray | null = null;
export const hasTray = () => tray !== null;
export function createTray() {
  try {
    tray = new Tray(nativeImage.createFromPath(getIconPath()).resize({ width: 16, height: 16 }));
    tray.setToolTip('Ripple');
    tray.setContextMenu(
      Menu.buildFromTemplate([
        {
          label: 'Show/Hide Ripple',
          click: () => {
            const window = getMainWindow();
            if (window?.isVisible()) window.hide();
            else showMainWindow();
          },
        },
        { type: 'separator' },
        { label: 'Quit', click: () => app.quit() },
      ]),
    );
  } catch (error) {
    console.error('Failed to create tray:', error);
  }
}
