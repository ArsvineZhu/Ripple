import { exec } from 'node:child_process';
import type { MediaTrack } from '../../../shared/contracts';
export function getSystemMedia(): Promise<MediaTrack | null> {
  return new Promise<MediaTrack | null>((resolve) => {
    const script = `
            tell application "System Events"
                set spotifyRunning to (name of every process) contains "Spotify"
                set musicRunning to (name of every process) contains "Music"
            end tell
            if spotifyRunning then
                try
                    tell application "Spotify"
                        set mediaState to player state as string
                        set songName to name of current track
                        set artistName to artist of current track
                        set albumName to album of current track
                        try
                            set artUrl to artwork url of current track
                        on error
                            set artUrl to ""
                        end try
                    end tell
                    return "Spotify" & "||" & mediaState & "||" & songName & "||" & artistName & "||" & albumName & "||" & artUrl
                on error
                    return "Error"
                end try
            else if musicRunning then
                try
                    tell application "Music" 
                        set mediaState to player state as string
                        set songName to name of current track
                        set artistName to artist of current track
                        set albumName to album of current track
                    end tell
                    return "Music" & "||" & mediaState & "||" & songName & "||" & artistName & "||" & albumName & "||" & "" 
                on error
                    return "Error"
                end try
            else
                return "None"
            end if
            `;
    exec(`osascript -e '${script}'`, (error, stdout) => {
      if (error) {
        return resolve(null);
      }
      const output = stdout.trim();

      if (!output || output === 'None' || output === 'Error') return resolve(null);

      const parts = output.split('||');
      if (parts.length >= 4) {
        resolve({
          name: parts[2],
          artist: parts[3],
          album: parts[4],
          artwork_url: parts[5] || null,
          state: parts[1] === 'playing' ? 'playing' : 'paused',
          source: parts[0],
        });
      } else {
        resolve(null);
      }
    });
  });
}

export function controlSystemMedia(
  command: import('../../../shared/contracts').MediaCommand,
): void {
  const script = `
        tell application "System Events"
            set spotifyRunning to (name of every process) contains "Spotify"
            set musicRunning to (name of every process) contains "Music"
        end tell
        if spotifyRunning then
            tell application "Spotify" to ${command} track
        else if musicRunning then
            tell application "Music" to ${command} track
        end if
        `;
  exec(`osascript -e '${script}'`);
}
