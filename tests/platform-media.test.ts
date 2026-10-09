import { beforeEach, expect, it, vi } from 'vitest';
const command = vi.hoisted(() => vi.fn());
vi.mock('../src/main/services/processes', () => ({ runCommand: command }));
import {
  getSystemMedia as linuxMedia,
  controlSystemMedia as linuxControl,
} from '../src/main/platform/linux/media';
import {
  getSystemMedia as macMedia,
  controlSystemMedia as macControl,
} from '../src/main/platform/macos/media';
beforeEach(() => {
  command.mockReset();
});

it('keeps Linux no-player results normal but propagates a missing media backend', async () => {
  command.mockRejectedValueOnce(
    Object.assign(new Error('none'), { code: 1, stderr: 'No players found\n' }),
  );
  await expect(linuxMedia()).resolves.toBeNull();
  const missing = Object.assign(new Error('missing'), { code: 'ENOENT' });
  command.mockRejectedValueOnce(missing);
  await expect(linuxMedia()).rejects.toBe(missing);
});

it('propagates media query and control failures on both Unix adapters', async () => {
  const denied = Object.assign(new Error('denied'), { code: 'EACCES' });
  command.mockRejectedValue(denied);
  await expect(macMedia()).rejects.toBe(denied);
  await expect(macControl('playpause')).rejects.toBe(denied);
  await expect(linuxControl('playpause')).rejects.toBe(denied);
});

it('avoids macOS Automation queries when neither supported player is running', async () => {
  command.mockResolvedValueOnce('/System/Applications/Notes.app/Contents/MacOS/Notes\n');
  await expect(macMedia()).resolves.toBeNull();
  expect(command).toHaveBeenCalledTimes(1);
});

it('compiles only the running macOS player and controls play/pause without a track suffix', async () => {
  command
    .mockResolvedValueOnce('/System/Applications/Music.app/Contents/MacOS/Music\n')
    .mockResolvedValueOnce('Music||playing||Song||Artist||Album||\n');
  await expect(macMedia()).resolves.toMatchObject({
    source: 'Music',
    name: 'Song',
    state: 'playing',
  });
  const query = command.mock.calls[1][1][1];
  expect(query).not.toContain('Spotify');
  expect(query).not.toContain('System Events');
  command.mockResolvedValueOnce('Music\n').mockResolvedValueOnce('');
  await macControl('playpause');
  expect(command).toHaveBeenLastCalledWith('osascript', [
    '-e',
    'tell application "Music" to playpause',
  ]);
});
