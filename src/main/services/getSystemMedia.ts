import { getSystemMedia as macos } from '../platform/macos/media';
import { getSystemMedia as windows } from '../platform/windows/media';
import { getSystemMedia as linux } from '../platform/linux/media';
export function getSystemMedia() {
  switch (process.platform) {
    case 'darwin':
      return macos();
    case 'win32':
      return windows();
    case 'linux':
      return linux();
    default:
      return Promise.resolve(null);
  }
}
