import { beforeEach, describe, expect, it, vi } from 'vitest';
const mock = vi.hoisted(() => ({
  sender: {},
  handlers: new Map<string, (event: { sender: unknown }, ...args: unknown[]) => unknown>(),
  events: new Map<string, (event: { sender: unknown }, ...args: unknown[]) => unknown>(),
  shape: vi.fn(),
  window: { webContents: {}, focus: vi.fn(), setBounds: vi.fn(), setIgnoreMouseEvents: vi.fn() },
}));
vi.mock('electron', () => ({
  ipcMain: {
    handle: (
      channel: string,
      callback: (event: { sender: unknown }, ...args: unknown[]) => unknown,
    ) => mock.handlers.set(channel, callback),
    on: (channel: string, callback: (event: { sender: unknown }, ...args: unknown[]) => unknown) =>
      mock.events.set(channel, callback),
  },
  screen: {
    getAllDisplays: () => [],
    getPrimaryDisplay: () => ({ id: 1, bounds: { x: 0, y: 0, width: 1920, height: 1080 } }),
  },
  shell: { openExternal: vi.fn() },
  app: {},
}));
vi.mock('../src/main/window', () => ({
  getMainWindow: () => mock.window,
  showMainWindow: vi.fn(),
  applyLinuxInputShape: mock.shape,
}));
vi.mock('../src/main/services/mediaControl', () => ({ controlSystemMedia: vi.fn() }));
import { registerIPC } from '../src/main/ipc';

describe('IPC boundary', () => {
  beforeEach(() => {
    mock.handlers.clear();
    mock.events.clear();
    mock.shape.mockClear();
    registerIPC();
  });
  it('rejects invoke messages from another webContents', () => {
    expect(() => mock.handlers.get('focus-window')!({ sender: mock.sender })).toThrow(
      'Unknown IPC sender',
    );
  });
  it('accepts only valid input rectangles from the owning renderer', () => {
    const rect = { x: 10, y: 20, width: 170, height: 40, scaleFactor: 1.5 };
    const send = mock.events.get('set-window-input-shape')!;
    send({ sender: mock.sender }, rect);
    send({ sender: mock.window.webContents }, { ...rect, width: NaN });
    send({ sender: mock.window.webContents }, { ...rect, scaleFactor: 0 });
    expect(mock.shape).not.toHaveBeenCalled();
    send({ sender: mock.window.webContents }, rect);
    expect(mock.shape).toHaveBeenCalledWith(rect);
  });
  it('rejects commands outside the media contract before executing platform code', () => {
    expect(() =>
      mock.handlers.get('control-system-media')!(
        { sender: mock.window.webContents },
        'shell-command',
      ),
    ).toThrow('Invalid media command');
  });
});
