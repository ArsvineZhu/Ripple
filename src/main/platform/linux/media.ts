import { runCommand } from '../../services/processes';
import type { MediaTrack } from '../../../shared/contracts';
export async function getSystemMedia(): Promise<MediaTrack | null> {
  let output: string;
  try {
    output = await runCommand('playerctl', [
      'metadata',
      '--format',
      '{{title}}||{{artist}}||{{album}}||{{status}}',
    ]);
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'stderr' in error &&
      typeof error.stderr === 'string' &&
      /^No players found\b/.test(error.stderr.trim())
    )
      return null;
    throw error;
  }
  if (!output.trim()) return null;
  const parts = output.trim().split('||');
  if (parts.length < 4) throw new TypeError('Invalid Linux media response');
  return {
    name: parts[0],
    artist: parts[1],
    album: parts[2],
    state: parts[3].toLowerCase(),
    source: 'System',
  };
}

export function controlSystemMedia(
  command: import('../../../shared/contracts').MediaCommand,
): Promise<void> {
  let cmd: string = command;
  if (command === 'playpause') cmd = 'play-pause';
  return runCommand('playerctl', [cmd]).then(() => {});
}
