import { app, ipcMain, screen, shell } from 'electron';
import { isLocale } from '../shared/i18n';
import type { AppState, AppStatePatch } from '../shared/appState';
import { noticeAreaForCode, noticeAreaForPatch } from '../shared/contracts';
import type { AppNotice, InputRect, NoticeArea, NoticeCode } from '../shared/contracts';
import { isAppStatePatch } from '../shared/appState';
import type { InvokeMap, QuickAppTarget } from '../shared/contracts';
import { QuickAppTargetSchema } from '../shared/contracts';
import { setTrayLocale } from './tray';
import { applyLinuxInputShape, getMainWindow, markRendererReady, showMainWindow } from './window';
import { discoverApps, buildAppCache, launchApp, launchQuickApp } from './services/apps';
import { setAutoLaunch } from './services/autostart';
import { getSystemMedia } from './services/getSystemMedia';
import { getBluetoothStatus } from './services/getBluetoothStatus';
import { getCameraStatus } from './services/getCameraStatus';
import { getMicrophoneStatus } from './services/getMicrophoneStatus';
import { controlSystemMedia } from './services/mediaControl';
import type { AssistantEvent } from '../shared/contracts';

interface StateStore {
  load(): Promise<AppState>;
  update(patch: AppStatePatch): Promise<AppState>;
}

interface SecretStore {
  setApiKey(value: string): Promise<void>;
  hasApiKey(): Promise<boolean>;
}

interface AssistantService {
  start(requestId: string, prompt: string, send: (event: AssistantEvent) => void): Promise<void>;
  cancel(requestId: string): void;
}

interface NoticeService {
  report(
    code: NoticeCode,
    detail?: string,
    severity?: AppNotice['severity'],
    area?: NoticeArea,
  ): void;
  rendererReady(): void;
}

interface IPCServices {
  stateStore: StateStore;
  secretStore: SecretStore;
  assistant: AssistantService;
  notices: NoticeService;
  applyBackgroundMode(enabled: boolean): void;
}

function getText(value: unknown, field: string, maximum = 4096) {
  if (typeof value !== 'string' || value.length > maximum) {
    throw new TypeError(`${field} must be a string of at most ${maximum} characters`);
  }
  return value;
}

function channelErrorCode(channel: keyof InvokeMap): NoticeCode | null {
  switch (channel) {
    case 'get-app-bootstrap':
      return 'stateLoadFailed';
    case 'update-app-state':
      return 'stateSaveFailed';
    case 'save-api-key':
      return 'secretStorageUnavailable';
    case 'launch-app':
    case 'launch-quick-app':
      return 'appLaunchFailed';
    case 'set-auto-launch':
      return 'autoLaunchFailed';
    default:
      return null;
  }
}

function handle<K extends keyof InvokeMap>(
  services: IPCServices,
  channel: K,
  listener: (
    ...args: InvokeMap[K]['args']
  ) => InvokeMap[K]['result'] | Promise<InvokeMap[K]['result']>,
) {
  ipcMain.handle(channel, async (event, ...args: unknown[]) => {
    if (event.sender !== getMainWindow()?.webContents) throw new Error('Unknown IPC sender');
    try {
      return await listener(...(args as InvokeMap[K]['args']));
    } catch (error) {
      const code = channelErrorCode(channel);
      if (code) {
        const detail = error instanceof Error ? error.message : String(error);
        const area =
          channel === 'update-app-state' && isAppStatePatch(args[0])
            ? noticeAreaForPatch(args[0])
            : noticeAreaForCode(code);
        services.notices.report(code, detail, 'error', area);
      }
      throw error;
    }
  });
}

function isInputRect(value: unknown): value is InputRect {
  if (!value || typeof value !== 'object') return false;
  const rect = value as Partial<InputRect>;
  return (
    [rect.x, rect.y, rect.width, rect.height, rect.scaleFactor].every(
      (field) => typeof field === 'number' && Number.isFinite(field),
    ) &&
    rect.width! > 0 &&
    rect.height! > 0 &&
    rect.scaleFactor! > 0
  );
}

export function registerIPC(services: IPCServices) {
  handle(services, 'get-app-bootstrap', async () => ({
    state: await services.stateStore.load(),
    hasApiKey: await services.secretStore.hasApiKey(),
  }));
  handle(services, 'update-app-state', async (patch) => {
    if (!isAppStatePatch(patch)) throw new TypeError('Invalid app state update');
    const state = await services.stateStore.update(patch);
    if (typeof patch.settings?.backgroundMode === 'boolean') {
      services.applyBackgroundMode(patch.settings.backgroundMode);
    }
    return state;
  });
  handle(services, 'save-api-key', (key) => {
    return services.secretStore.setApiKey(getText(key, 'API key', 8192));
  });
  handle(services, 'launch-quick-app', async (id) => {
    const quickAppId = getText(id, 'Quick app ID', 128);
    const state = await services.stateStore.load();
    const appTarget = state.quickApps.find((quickApp) => quickApp.id === quickAppId)?.target;
    if (!appTarget) throw new TypeError('Quick app is not configured');
    const target: QuickAppTarget = QuickAppTargetSchema.parse(appTarget);
    await launchQuickApp(target);
  });
  handle(services, 'discover-apps', (query) =>
    discoverApps(getText(query, 'Application query', 256)),
  );
  handle(services, 'renderer-ready', () => {
    markRendererReady();
    services.notices.rendererReady();
  });
  handle(services, 'start-assistant', (requestId, prompt) => {
    const id = getText(requestId, 'Request ID', 128);
    const userPrompt = getText(prompt, 'Prompt', 30000);
    return services.assistant.start(id, userPrompt, (payload) => {
      getMainWindow()?.webContents.send('assistant-event', payload);
    });
  });
  handle(services, 'cancel-assistant', (requestId) => {
    services.assistant.cancel(getText(requestId, 'Request ID', 128));
  });
  handle(services, 'get-system-locale', () => app.getLocale());
  handle(services, 'set-ui-locale', (locale) => {
    if (!isLocale(locale)) throw new TypeError('Invalid locale');
    setTrayLocale(locale);
  });
  handle(services, 'set-ignore-mouse-events', (ignore, forward) => {
    if (typeof ignore !== 'boolean' || typeof forward !== 'boolean') {
      throw new TypeError('Invalid mouse passthrough options');
    }
    const window = getMainWindow();
    if (process.platform !== 'linux' && window) window.setIgnoreMouseEvents(ignore, { forward });
  });
  ipcMain.on('set-window-input-shape', (event, rect: unknown) => {
    if (event.sender !== getMainWindow()?.webContents || !isInputRect(rect)) return;
    try {
      applyLinuxInputShape(rect);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      services.notices.report('inputShapeFailed', detail);
    }
  });
  handle(services, 'focus-window', () => {
    showMainWindow();
    getMainWindow()?.focus();
  });
  handle(services, 'open-external', async (url) => {
    const value = getText(url, 'URL', 8192);
    await shell.openExternal(value);
  });
  handle(services, 'launch-app', (name) => launchApp(getText(name, 'Application name')));
  handle(services, 'build-app-cache', buildAppCache);
  handle(services, 'get-system-media', getSystemMedia);
  handle(services, 'get-bluetooth-status', getBluetoothStatus);
  handle(services, 'get-camera-status', getCameraStatus);
  handle(services, 'get-microphone-status', getMicrophoneStatus);
  handle(services, 'control-system-media', (command) => {
    if (!['previous', 'playpause', 'next'].includes(command)) {
      throw new TypeError('Invalid media command');
    }
    controlSystemMedia(command);
  });
  handle(services, 'get-displays', () =>
    screen.getAllDisplays().map((display) => ({
      id: display.id,
      label: display.label || `Display ${display.id}`,
      bounds: display.bounds,
    })),
  );
  handle(services, 'set-display', (id) => {
    if (typeof id !== 'string' && typeof id !== 'number') throw new TypeError('Invalid display');
    const target =
      screen.getAllDisplays().find((display) => String(display.id) === String(id)) ||
      screen.getPrimaryDisplay();
    getMainWindow()?.setBounds(target.bounds);
    showMainWindow();
  });
  handle(services, 'set-auto-launch', async (enable) => {
    if (typeof enable !== 'boolean') throw new TypeError('Expected boolean');
    await setAutoLaunch(enable);
  });
}
