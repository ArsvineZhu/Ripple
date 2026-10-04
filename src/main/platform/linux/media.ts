import { exec } from 'node:child_process';
import type { MediaTrack } from '../../../shared/contracts';
export function getSystemMedia(): Promise<MediaTrack | null> {
  return new Promise<MediaTrack | null>((resolve) => {
    exec(
      'playerctl metadata --format "{{title}}||{{artist}}||{{album}}||{{status}}"',
      (err, stdout) => {
        if (err || !stdout) return resolve(null);
        const parts = stdout.trim().split('||');
        resolve({
          name: parts[0],
          artist: parts[1],
          album: parts[2],
          state: parts[3].toLowerCase(),
          source: 'System',
        });
      },
    );
  });
}

export function controlSystemMedia(
  command: import('../../../shared/contracts').MediaCommand,
): void {
  let cmd: string = command;
  if (command === 'playpause') cmd = 'play-pause';
  exec(`playerctl ${cmd}`);
}
