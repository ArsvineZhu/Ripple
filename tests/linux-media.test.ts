import { afterEach, expect, it, vi } from 'vitest';
import dbus from 'dbus-native';
import {
  getMediaSessions,
  controlSystemMedia,
  openMediaSession,
  close,
} from '../src/main/platform/linux/media';
let broker: ReturnType<typeof dbus.createBroker> | undefined;
let player: ReturnType<typeof dbus.createClient> | undefined;
afterEach(async () => {
  close();
  player?.connection.end();
  await new Promise<void>((resolve) => (broker ? broker.close(resolve) : resolve()));
  vi.unstubAllEnvs();
});
it('reads capabilities and artwork over D-Bus and targets the exact unique owner', async () => {
  broker = dbus.createBroker();
  await new Promise<void>((resolve, reject) =>
    broker!.listen({ host: '127.0.0.1', port: 0 }, (error) => (error ? reject(error) : resolve())),
  );
  const address = broker.address()!;
  vi.stubEnv('DBUS_SESSION_BUS_ADDRESS', address);
  player = dbus.createClient({ busAddress: address, timeout: 2000 });
  player.on('error', () => {});
  const paused = vi.fn();
  const raised = vi.fn();
  player.exportInterface(
    { Identity: 'Fixture', DesktopEntry: 'fixture', Raise: raised },
    '/org/mpris/MediaPlayer2',
    {
      name: 'org.mpris.MediaPlayer2',
      properties: { Identity: 's', DesktopEntry: 's' },
      methods: { Raise: ['', '', [], []] },
    },
  );
  player.exportInterface(
    {
      PlaybackStatus: 'Playing',
      CanControl: true,
      CanGoNext: false,
      CanGoPrevious: true,
      CanPlay: true,
      CanPause: true,
      Metadata: {
        'xesam:title': new dbus.Variant('s', 'Song || quote'),
        'xesam:artist': new dbus.Variant('as', ['One', 'Two']),
        'mpris:artUrl': new dbus.Variant('s', 'https://example.com/art.png'),
      },
      Pause: paused,
    },
    '/org/mpris/MediaPlayer2',
    {
      name: 'org.mpris.MediaPlayer2.Player',
      methods: { Pause: ['', '', [], []] },
      properties: {
        PlaybackStatus: 's',
        CanControl: 'b',
        CanGoNext: 'b',
        CanGoPrevious: 'b',
        CanPlay: 'b',
        CanPause: 'b',
        Metadata: 'a{sv}',
      },
    },
  );
  await player.invokeDbus({
    member: 'RequestName',
    signature: 'su',
    body: ['org.mpris.MediaPlayer2.fixture', 0],
  });
  const result = await getMediaSessions();
  expect(result.sessions).toHaveLength(1);
  const session = result.sessions[0];
  expect(session.id).toMatch(/^:\d+\.\d+\|org.mpris/);
  expect(session).toMatchObject({
    name: 'Song || quote',
    artist: 'One, Two',
    artwork_url: 'https://example.com/art.png',
    capabilities: { next: false, previous: true },
  });
  await controlSystemMedia('playpause', session);
  expect(paused).toHaveBeenCalledTimes(1);
  await openMediaSession(session);
  expect(raised).toHaveBeenCalledTimes(1);
  await player.close();
  player = undefined;
  await expect(controlSystemMedia('playpause', session)).rejects.toThrow();
}, 10000);
