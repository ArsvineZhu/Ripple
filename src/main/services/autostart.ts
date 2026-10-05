import { setAutoLaunch as windows } from '../platform/windows/autostart';
import { setAutoLaunch as linux } from '../platform/linux/autostart';
export async function setAutoLaunch(enable: boolean): Promise<void> {
  if (process.platform === 'linux') await linux(enable);
  else if (process.platform === 'win32') windows(enable);
}
