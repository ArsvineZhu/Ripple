import { z } from 'zod';
import type { MediaCommand, MediaTrack } from '../../../shared/contracts';
import { runPowerShell, winrtAsync } from './powershell';

const winrt =
  winrtAsync +
  String.raw`
$managerType = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media.Control, ContentType = WindowsRuntime]
$manager = Await-WinRT ($managerType::RequestAsync()) $managerType
$session = $manager.GetCurrentSession()
`;

export async function controlSystemMedia(command: MediaCommand): Promise<void> {
  const operation = {
    previous: 'TrySkipPreviousAsync',
    playpause: 'TryTogglePlayPauseAsync',
    next: 'TrySkipNextAsync',
  }[command];
  await runPowerShell(
    winrt +
      '\nif ($session) { if (-not (Await-WinRT ($session.' +
      operation +
      '()) ([bool]))) { throw "Media command declined" } }',
  );
}

const MediaSchema = z.object({
  Title: z.string(),
  Artist: z.string(),
  Album: z.string(),
  Status: z.string(),
  Source: z.string(),
  Artwork: z.string().nullable(),
});

export async function getSystemMedia(): Promise<MediaTrack | null> {
  const output = await runPowerShell(
    winrt +
      String.raw`
if (-not $session) { return 'null' }
$propertiesType = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties, Windows.Media.Control, ContentType = WindowsRuntime]
$props = Await-WinRT ($session.TryGetMediaPropertiesAsync()) $propertiesType
$artwork = $null
if ($props.Thumbnail) {
  $stream = $null
  $reader = $null
  try {
    $streamType = [Windows.Storage.Streams.IRandomAccessStreamWithContentType, Windows.Storage.Streams, ContentType = WindowsRuntime]
    $stream = Await-WinRT ($props.Thumbnail.OpenReadAsync()) $streamType
    if ($stream.Size -le 5MB) {
      $reader = [Windows.Storage.Streams.DataReader]::new($stream)
      $null = Await-WinRT ($reader.LoadAsync([uint32]$stream.Size)) ([uint32])
      $buffer = New-Object byte[] ([int]$stream.Size)
      $reader.ReadBytes($buffer)
      $artwork = 'data:' + $stream.ContentType + ';base64,' + [Convert]::ToBase64String($buffer)
    }
  } finally {
    if ($reader) { $reader.Dispose() }
    if ($stream) { $stream.Dispose() }
  }
}
@{ Title = [string]$props.Title; Artist = [string]$props.Artist; Album = [string]$props.AlbumTitle;
   Status = $session.GetPlaybackInfo().PlaybackStatus.ToString().ToLowerInvariant();
   Source = [string]$session.SourceAppUserModelId; Artwork = $artwork } | ConvertTo-Json -Compress
`,
    { maxBuffer: 10 * 1024 * 1024 },
  );
  const result: unknown = JSON.parse(output);
  if (result === null) return null;
  const data = MediaSchema.parse(result);
  return {
    name: data.Title,
    artist: data.Artist,
    album: data.Album,
    artwork_url: data.Artwork,
    state: data.Status === 'playing' ? 'playing' : 'paused',
    source: data.Source,
  };
}
