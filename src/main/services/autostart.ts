import { setAutoLaunch as windows } from '../platform/windows/autostart';
import { setAutoLaunch as linux } from '../platform/linux/autostart';
import { app } from 'electron';
export async function setAutoLaunch(enable: boolean): Promise<void> {
  if (process.platform === 'linux') await linux(enable);
  else if (process.platform === 'win32') windows(enable);
  else if (process.platform === 'darwin') {
    if (!app.isPackaged) throw new Error('macOS login items require a packaged application');
    app.setLoginItemSettings({ openAtLogin: enable });
    if (app.getLoginItemSettings().openAtLogin !== enable)
      throw new Error('macOS did not accept the login item setting');
  }
}
