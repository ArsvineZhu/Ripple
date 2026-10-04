import { getMicrophoneStatus as macos } from '../platform/macos/devices';
import { getMicrophoneStatus as windows } from '../platform/windows/devices';
import { getMicrophoneStatus as linux } from '../platform/linux/devices';
export function getMicrophoneStatus() {
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
