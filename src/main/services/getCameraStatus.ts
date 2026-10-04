import { getCameraStatus as macos } from '../platform/macos/devices';
import { getCameraStatus as windows } from '../platform/windows/devices';
import { getCameraStatus as linux } from '../platform/linux/devices';
export function getCameraStatus() {
  switch (process.platform) {
    case 'darwin':
      return macos();
    case 'win32':
      return windows();
    case 'linux':
      return linux();
    default:
      return Promise.resolve(false);
  }
}
