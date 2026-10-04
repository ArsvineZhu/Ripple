import { app } from 'electron';
export function setAutoLaunch(enable: boolean): void {
  try {
    app.setLoginItemSettings({
      openAtLogin: enable,
      path: app.getPath('exe'),
    });
  } catch (e) {
    console.error('Failed to set login item settings on Windows:', e);
  }
}
