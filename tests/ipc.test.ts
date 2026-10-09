import { beforeEach, describe, expect, it, vi } from 'vitest';
const mock = vi.hoisted(() => ({
  sender: {},
  handlers: new Map<string, (event: { sender: unknown }, ...args: unknown[]) => unknown>(),
  events: new Map<string, (event: { sender: unknown }, ...args: unknown[]) => unknown>(),
  shape: vi.fn(),
  openDiagnosticsFolder: vi.fn(),
  recordApplicationError: vi.fn(),
  readClipboard: vi.fn(),
  writeClipboard: vi.fn(),
  recordDiagnostic: vi.fn(),
  window: {
    webContents: {},
    focus: vi.fn(),
    setBounds: vi.fn(),
    setIgnoreMouseEvents: vi.fn(),
  },
}));
vi.mock('electron', () => ({
  clipboard: { readText: mock.readClipboard, writeText: mock.writeClipboard },
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
    getPrimaryDisplay: () => ({
      id: 1,
      bounds: { x: 0, y: 0, width: 1920, height: 1080 },
    }),
  },
  shell: { openExternal: vi.fn() },
  app: { getLocale: () => 'zh-HK' },
}));
vi.mock('../src/main/window', () => ({
  getMainWindow: () => mock.window,
  showMainWindow: vi.fn(),
  applyWindowInputRegion: mock.shape,
}));
vi.mock('../src/main/services/mediaControl', () => ({
  controlSystemMedia: vi.fn(),
}));
vi.mock('../src/main/tray', () => ({ setTrayLocale: vi.fn() }));
import { setTrayLocale } from '../src/main/tray';
import { registerIPC } from '../src/main/ipc';
import { defaultAppState } from '../src/shared/appState';

const services = {
  stateStore: {
    load: async () => defaultAppState,
    update: async () => defaultAppState,
  },
  secretStore: {
    setApiKey: async () => {},
    hasApiKey: async () => false,
  },
  assistant: {
    start: async () => null,
    cancel: () => {},
  },
  notices: {
    report: vi.fn(),
    rendererReady: vi.fn(),
  },
  diagnostics: {
    record: mock.recordDiagnostic,
    openFolder: mock.openDiagnosticsFolder,
    recordError: mock.recordApplicationError,
  },
  applyBackgroundMode: vi.fn(),
};

describe('IPC boundary', () => {
  beforeEach(() => {
    mock.handlers.clear();
    mock.events.clear();
    mock.shape.mockClear();
    mock.openDiagnosticsFolder.mockReset().mockResolvedValue(undefined);
    mock.recordApplicationError.mockClear();
    services.notices.report.mockClear();
    registerIPC(services);
  });
  it('rejects invoke messages from another webContents', async () => {
    await expect(mock.handlers.get('focus-window')!({ sender: mock.sender })).rejects.toThrow(
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
  it('reads the system locale and accepts only supported resolved tray languages', async () => {
    const event = { sender: mock.window.webContents };
    await expect(mock.handlers.get('get-system-locale')!(event)).resolves.toBe('zh-HK');
    await expect(mock.handlers.get('set-ui-locale')!(event, 'de')).rejects.toThrow(
      'Invalid locale',
    );
    await mock.handlers.get('set-ui-locale')!(event, 'ja');
    expect(setTrayLocale).toHaveBeenCalledWith('ja');
  });
  it('applies background presence changes after persisting the setting', async () => {
    const event = { sender: mock.window.webContents };
    await mock.handlers.get('update-app-state')!(event, {
      settings: { backgroundMode: true },
    });
    expect(services.applyBackgroundMode).toHaveBeenCalledWith(true);
  });
  it('rejects commands outside the media contract before executing platform code', async () => {
    await expect(
      mock.handlers.get('control-system-media')!(
        { sender: mock.window.webContents },
        'shell-command',
      ),
    ).rejects.toThrow('Invalid media command');
  });
  it('opens the diagnostics directory through the service', async () => {
    await mock.handlers.get('open-diagnostics-folder')!({
      sender: mock.window.webContents,
    });
    expect(mock.openDiagnosticsFolder).toHaveBeenCalledOnce();
  });
  it('reads native clipboard text without recording its contents', async () => {
    mock.readClipboard.mockReturnValue('private clipboard text');
    const result = await mock.handlers.get('read-clipboard-text')!({
      sender: mock.window.webContents,
    });
    expect(result).toBe('private clipboard text');
    expect(JSON.stringify(mock.recordDiagnostic.mock.calls)).not.toContain(
      'private clipboard text',
    );
  });
  it('records a polled failure once, counts repeats, and records recovery', async () => {
    mock.recordDiagnostic.mockClear();
    const event = { sender: mock.window.webContents };
    const error = Object.assign(new Error('private clipboard message'), { code: 'EACCES' });
    mock.readClipboard
      .mockImplementationOnce(() => {
        throw error;
      })
      .mockImplementationOnce(() => {
        throw error;
      })
      .mockReturnValue('recovered private text');
    const read = mock.handlers.get('read-clipboard-text')!;
    await expect(read(event)).rejects.toBe(error);
    await expect(read(event)).rejects.toBe(error);
    await expect(read(event)).resolves.toBe('recovered private text');
    expect(mock.recordDiagnostic.mock.calls.map(([entry]) => entry.phase)).toEqual([
      'failed',
      'recovered',
    ]);
    expect(mock.recordDiagnostic.mock.calls[1][0].repeated).toBe(1);
    expect(JSON.stringify(mock.recordDiagnostic.mock.calls)).not.toContain('private');
  });
  it('records IPC failure channel and system code without recording arguments', async () => {
    mock.recordDiagnostic.mockClear();
    const error = Object.assign(new Error('private arguments'), { code: 'EACCES' });
    mock.openDiagnosticsFolder.mockRejectedValueOnce(error);
    await expect(
      mock.handlers.get('open-diagnostics-folder')!({ sender: mock.window.webContents }),
    ).rejects.toBe(error);
    expect(mock.recordDiagnostic).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'ipc-operation',
        channel: 'open-diagnostics-folder',
        phase: 'failed',
        error: expect.objectContaining({ code: 'EACCES' }),
      }),
    );
    expect(JSON.stringify(mock.recordDiagnostic.mock.calls)).not.toContain('private arguments');
  });
  it('reports diagnostics folder failures in Settings and preserves the IPC rejection', async () => {
    const error = new Error('Could not open diagnostics directory');
    mock.openDiagnosticsFolder.mockRejectedValueOnce(error);
    await expect(
      mock.handlers.get('open-diagnostics-folder')!({
        sender: mock.window.webContents,
      }),
    ).rejects.toBe(error);
    expect(services.notices.report).toHaveBeenCalledWith(
      'diagnosticsFolderOpenFailed',
      'Could not open diagnostics directory',
      'error',
      'settings',
    );
    expect(mock.recordDiagnostic).toHaveBeenCalledWith(
      expect.objectContaining({ channel: 'open-diagnostics-folder', phase: 'failed' }),
    );
  });
});
