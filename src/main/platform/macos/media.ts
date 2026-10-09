import { runCommand } from '../../services/processes';
import type { MediaTrack } from '../../../shared/contracts';

async function runningPlayer(): Promise<'Spotify' | 'Music' | null> {
  const names = (await runCommand('/bin/ps', ['-A', '-o', 'comm=']))
    .split('\n')
    .map((name) => name.trim().split('/').at(-1));
  return names.includes('Spotify') ? 'Spotify' : names.includes('Music') ? 'Music' : null;
}
export async function getSystemMedia(): Promise<MediaTrack | null> {
  const player = await runningPlayer();
  if (!player) return null;
  // Compile only the running player's dictionary. Referencing an uninstalled
  // player in AppleScript can otherwise prompt the user to locate its app.
  const script = `
                    tell application "${player}"
                        set mediaState to player state as string
                        if mediaState is "stopped" then return "None"
                        set songName to name of current track
                        set artistName to artist of current track
                        set albumName to album of current track
                        ${
                          player === 'Spotify'
                            ? `try
                            set artUrl to artwork url of current track
                        on error
                            set artUrl to ""
                        end try`
                            : 'set artUrl to ""'
                        }
                    end tell
                    return "${player}" & "||" & mediaState & "||" & songName & "||" & artistName & "||" & albumName & "||" & artUrl
            `;
  const stdout = await runCommand('osascript', ['-e', script]);
  const output = stdout.trim();

  if (!output || output === 'None') return null;

  const parts = output.split('||');
  if (parts.length === 6) {
    return {
      name: parts[2],
      artist: parts[3],
      album: parts[4],
      artwork_url: parts[5] || null,
      state: parts[1] === 'playing' ? 'playing' : 'paused',
      source: parts[0],
    };
  } else {
    throw new TypeError('Invalid macOS media response');
  }
}

export async function controlSystemMedia(
  command: import('../../../shared/contracts').MediaCommand,
): Promise<void> {
  const operation = command === 'playpause' ? 'playpause' : command + ' track';
  const player = await runningPlayer();
  if (!player) throw new Error('No supported media player is running');
  await runCommand('osascript', ['-e', `tell application "${player}" to ${operation}`]);
}
