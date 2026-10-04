import { app, BrowserWindow } from 'electron';
import { registerIPC } from './ipc';
import { createWindow, initializeLinuxInputShape, closeInputConnection } from './window';
import { createTray, hasTray } from './tray';
registerIPC();
void app.whenReady().then(() => {
  if (process.platform === 'darwin') app.dock?.hide();
  initializeLinuxInputShape();
  createWindow();
  createTray();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
app.on('before-quit', closeInputConnection);
app.on('window-all-closed', () => {
  if (process.platform === 'linux' && !hasTray()) app.quit();
});
