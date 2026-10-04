import { setAutoLaunch as windows } from '../platform/windows/autostart';
import { setAutoLaunch as linux } from '../platform/linux/autostart';
export function setAutoLaunch(enable: boolean): void {
  if (process.platform === 'linux') linux(enable);
  else if (process.platform === 'win32') windows(enable);
}
