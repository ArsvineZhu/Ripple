import { controlSystemMedia as macos } from '../platform/macos/media';
import { controlSystemMedia as linux } from '../platform/linux/media';
import { controlSystemMedia as windows } from '../platform/windows/media';
import type { MediaCommand } from '../../shared/contracts';
export function controlSystemMedia(command: MediaCommand): void {
  if (process.platform === 'darwin') macos(command);
  else if (process.platform === 'linux') linux(command);
  else if (process.platform === 'win32') windows(command);
}
