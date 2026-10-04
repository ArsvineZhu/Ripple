import { getBluetoothStatus as macos } from '../platform/macos/devices';
import { getBluetoothStatus as windows } from '../platform/windows/devices';
import { getBluetoothStatus as linux } from '../platform/linux/devices';
export function getBluetoothStatus() {
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
