import { controlSystemMedia as macos } from '../platform/macos/media';
import { controlSystemMedia as linux } from '../platform/linux/media';
import { controlSystemMedia as windows } from '../platform/windows/media';
import type { MediaCommand } from '../../shared/contracts';
export async function controlSystemMedia(command: MediaCommand): Promise<void> {
  if (process.platform === 'darwin') await macos(command);
  else if (process.platform === 'linux') await linux(command);
  else if (process.platform === 'win32') await windows(command);
}
