/** @vitest-environment happy-dom */
import { act, createElement, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import { useMedia } from '../src/renderer/hooks/useMedia';
import type { MediaSession, MediaSnapshot } from '../src/shared/contracts';
vi.mock('../src/renderer/lib/diagnostics', () => ({ recordRendererError: vi.fn() }));
let root: ReturnType<typeof createRoot> | undefined;
let hook: ReturnType<typeof useMedia>;
afterEach(async () => {
  if (root) await act(async () => root!.unmount());
  root = undefined;
  vi.useRealTimers();
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
  Reflect.deleteProperty(window, 'electronAPI');
});
function snapshot(artwork: string): MediaSnapshot {
  const item: MediaSession = {
    id: 'one',
    source: 'one',
    playerName: 'one',
    name: 'Song',
    artist: 'Artist',
    state: 'playing',
    artwork_url: artwork,
    capabilities: { previous: true, next: true, play: true, pause: true, toggle: true },
  };
  return {
    sessions: [item],
    activeSessionId: 'one',
    manualSessionId: null,
    status: 'ready',
    lastSuccessfulReadAt: 1,
    error: null,
  };
}
async function mount(api: unknown) {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.useFakeTimers();
  Object.defineProperty(window, 'electronAPI', { configurable: true, value: api });
  const element = document.createElement('div');
  document.body.append(element);
  root = createRoot(element);
  function Test() {
    const value = useMedia();
    useEffect(() => {
      hook = value;
    }, [value]);
    return null;
  }
  await act(async () => root!.render(createElement(Test)));
}
it('updates a changed artwork URL and distinguishes failed reading from no session', async () => {
  const read = vi
    .fn()
    .mockResolvedValueOnce(snapshot('first'))
    .mockResolvedValueOnce(snapshot('second'))
    .mockRejectedValueOnce(new Error('read failed'))
    .mockResolvedValueOnce({
      ...snapshot(''),
      sessions: [],
      activeSessionId: null,
      status: 'idle',
    });
  await mount({ getSystemMedia: read });
  expect(hook.mediaTrack?.artwork_url).toBe('first');
  await act(async () => vi.advanceTimersByTimeAsync(5000));
  expect(hook.mediaTrack?.artwork_url).toBe('second');
  await act(async () => vi.advanceTimersByTimeAsync(5000));
  expect(hook.mediaSnapshot.error).toBe('mediaReadFailed');
  expect(hook.mediaTrack?.stale).toBe(true);
  await act(async () => vi.advanceTimersByTimeAsync(5000));
  expect(hook.mediaTrack).toBeNull();
  expect(hook.mediaSnapshot.error).toBeNull();
});
it('ignores an old pending poll after manual selection and refreshes control results immediately', async () => {
  let complete: (snapshot: MediaSnapshot) => void = () => {};
  const selected = { ...snapshot('new'), manualSessionId: 'one' };
  const read = vi.fn(
    () =>
      new Promise<MediaSnapshot>((resolve) => {
        complete = resolve;
      }),
  );
  const select = vi.fn().mockResolvedValue({ snapshot: selected, error: null });
  const control = vi.fn().mockResolvedValue({
    snapshot: { ...selected, sessions: [{ ...selected.sessions[0], state: 'paused' }] },
    error: null,
  });
  await mount({ getSystemMedia: read, selectMediaSession: select, controlSystemMedia: control });
  await act(async () => hook.selectMediaSession('one'));
  await act(async () => complete(snapshot('old')));
  expect(hook.mediaTrack?.artwork_url).toBe('new');
  await act(async () => hook.controlMedia('playpause', 'one'));
  expect(control).toHaveBeenCalledWith('playpause', 'one');
  expect(hook.mediaTrack?.state).toBe('paused');
});
