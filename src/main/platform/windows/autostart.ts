import { app } from 'electron';
export function setAutoLaunch(enable: boolean): void {
  app.setLoginItemSettings({
    openAtLogin: enable,
    path: app.getPath('exe'),
  });
}
