import { exec, execFile } from 'node:child_process';
import type { MediaCommand, MediaTrack } from '../../../shared/contracts';

let reportMediaError = (_error: unknown) => {};

export function setWindowsMediaErrorHandler(handler: (error: unknown) => void): void {
  reportMediaError = handler;
}

export function controlSystemMedia(command: MediaCommand): void {
  const operation = {
    previous: 'TrySkipPreviousAsync',
    playpause: 'TryTogglePlayPauseAsync',
    next: 'TrySkipNextAsync',
  }[command];
  const psScript = `
    $ErrorActionPreference = 'Stop'
    Add-Type -AssemblyName System.Runtime.WindowsRuntime
    $manager = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media.Control, ContentType = WindowsRuntime]::RequestAsync().GetAwaiter().GetResult()
    $session = $manager.GetCurrentSession()
    if ($session) {
      $operation = $session.${operation}()
      $operation.GetAwaiter().GetResult() | Out-Null
    }
  `;
  const encodedScript = Buffer.from(psScript, 'utf16le').toString('base64');
  execFile(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-EncodedCommand', encodedScript],
    { windowsHide: true },
    (error) => {
      if (error) reportMediaError(error);
    },
  );
}

export function getSystemMedia(): Promise<MediaTrack | null> {
  return new Promise<MediaTrack | null>((resolve) => {
    const psScript = `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; Add-Type -AssemblyName System.Runtime.WindowsRuntime; $manager = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media.Control, ContentType = WindowsRuntime]::RequestAsync().GetAwaiter().GetResult(); $session = $manager.GetCurrentSession(); if ($session) { $props = $session.TryGetMediaPropertiesAsync().GetAwaiter().GetResult(); $playback = $session.GetPlaybackInfo(); $status = $playback.PlaybackStatus; $thumbnail = $props.Thumbnail; $artwork = ''; if ($thumbnail) { try { $stream = $thumbnail.OpenReadAsync().GetAwaiter().GetResult(); $buffer = New-Object byte[] $stream.Size; $reader = New-Object Windows.Storage.Streams.DataReader $stream; $reader.LoadAsync($stream.Size).GetAwaiter().GetResult() | Out-Null; $reader.ReadBytes($buffer); $artwork = 'data:image/png;base64,' + [Convert]::ToBase64String($buffer); $reader.Close(); $stream.Close(); } catch { } } $info = @{ Title = $props.Title; Artist = $props.Artist; Album = $props.AlbumTitle; Status = $status.ToString().ToLower(); Source = $session.SourceAppUserModelId; Artwork = $artwork }; return $info | ConvertTo-Json -Compress; } return 'null';`;

    // Use EncodedCommand to avoid quoting/escaping issues and increase buffer
    const enc = Buffer.from(psScript, 'utf16le').toString('base64');
    exec(
      `powershell -NoProfile -EncodedCommand ${enc}`,
      { maxBuffer: 10 * 1024 * 1024, encoding: 'utf8' },
      (error, stdout) => {
        if (error) reportMediaError(error);

        if (error || !stdout || stdout.trim() === 'null' || stdout.trim() === "'null'") {
          // Fallback: try reading Spotify window title
          exec(
            `powershell -NoProfile -Command "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; Get-Process | Where-Object {$_.ProcessName -eq 'Spotify'} | Select-Object MainWindowTitle"`,
            { encoding: 'utf8' },
            (err, out) => {
              if (err || !out) {
                if (err) reportMediaError(err);
                return resolve(null);
              }
              const title = out
                .split('\n')
                .find((l) => l.includes('-'))
                ?.trim();
              if (title) {
                const [artist, ...songParts] = title.split(' - ');
                const song = songParts.join(' - ');
                resolve({
                  name: song || title,
                  artist: artist || '',
                  state: 'playing',
                  source: 'Spotify',
                });
              } else {
                resolve(null);
              }
            },
          );
          return;
        }

        try {
          const data = JSON.parse(stdout);
          resolve({
            name: data.Title || '',
            artist: data.Artist || '',
            album: data.Album || '',
            artwork_url: data.Artwork || null,
            state: data.Status === 'playing' ? 'playing' : 'paused',
            source: data.Source || 'System',
          });
        } catch (e) {
          reportMediaError(e);
          resolve(null);
        }
      },
    );
  });
}
