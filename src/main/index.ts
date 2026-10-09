import { app, powerMonitor, safeStorage, screen } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { defaultAppState } from '../shared/appState';
import { registerIPC } from './ipc';
import {
  closeInputConnection,
  createWindow,
  getMainWindow,
  initializeLinuxInputShape,
  setWindowBackgroundMode,
} from './window';
import { hasTray, setTrayVisible } from './tray';
import { shouldQuitAfterLastWindow } from './appLifecycle';
import { configureSettingsWindow, openSettingsWindow } from './settingsWindow';
import { createAppStateStore } from './services/appStateStore';
import { createSecretStore } from './services/secretStore';
import { createAssistantService } from './services/assistant';
import { createNoticeBus } from './services/noticeBus';
import { initializeDiagnostics, type DiagnosticsService } from './services/diagnostics';
import {
  installChildProcessDiagnostics,
  installFatalErrorMonitor,
} from './services/processDiagnostics';
import {
  installBackgroundImageProtocol,
  registerBackgroundImageScheme,
} from './services/backgroundImage';

registerBackgroundImageScheme();
app.setName('Ripple Next');
if (process.platform === 'win32') app.setAppUserModelId('com.arsvinezhu.ripple-next');
// Keep macOS out of the Dock in both packaged (LSUIElement) and `pnpm start` runs.
if (process.platform === 'darwin') app.setActivationPolicy('accessory');

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  void startApplication();
}

async function startApplication() {
  const userDataPath = path.join(app.getPath('appData'), 'Ripple Next');
  fs.mkdirSync(userDataPath, { recursive: true, mode: 0o700 });
  app.setPath('userData', userDataPath);

  const notices = createNoticeBus();
  let diagnostics: DiagnosticsService | null = null;
  let startupComplete = false;
  let closeMedia = () => {};
  function reportWindowLoadError(error: unknown) {
    diagnostics?.recordError('window', error);
    const detail = error instanceof Error ? error.message : String(error);
    notices.report('windowLoadFailed', detail);
  }
  function reportInputShapeError(error: unknown) {
    const detail = error instanceof Error ? error.message : String(error);
    notices.report('inputShapeFailed', detail);
  }
  function reportBackgroundModeError(error: unknown) {
    diagnostics?.recordError('application', error);
    const detail = error instanceof Error ? error.message : String(error);
    notices.report('backgroundModeFailed', detail, 'warning', 'settings');
  }

  app.on('second-instance', () => {
    if (!startupComplete || !diagnostics) return;
    if (!getMainWindow()) createWindow(diagnostics, reportWindowLoadError);
    openSettingsWindow();
  });
  app.on('activate', () => {
    if (!startupComplete || !diagnostics) return;
    if (!getMainWindow()) createWindow(diagnostics, reportWindowLoadError);
    openSettingsWindow();
  });

  const diagnosticsService = await initializeDiagnostics(userDataPath);
  diagnostics = diagnosticsService;
  diagnosticsService.record({
    kind: 'app-start',
    appVersion: app.getVersion(),
    electronVersion: process.versions.electron ?? '',
    chromiumVersion: process.versions.chrome ?? '',
    nodeVersion: process.versions.node ?? process.version,
    platform: process.platform,
    architecture: process.arch,
    osRelease: os.release(),
  });
  installFatalErrorMonitor(diagnosticsService);
  installChildProcessDiagnostics(app, diagnosticsService);
  let graphicsSignature = '';
  app.on('gpu-info-update', () => {
    const gpu = app.getGPUFeatureStatus();
    const event = {
      kind: 'graphics-status' as const,
      hardwareAcceleration: app.isHardwareAccelerationEnabled(),
      compositing: gpu.gpu_compositing,
      rasterization: gpu.rasterization,
      webgl: gpu.webgl,
    };
    const signature = JSON.stringify(event);
    if (signature === graphicsSignature) return;
    graphicsSignature = signature;
    diagnosticsService.record(event);
  });

  const stateStore = createAppStateStore(userDataPath);
  const secretStore = createSecretStore(stateStore, {
    isAsyncEncryptionAvailable: () => safeStorage.isAsyncEncryptionAvailable(),
    encryptStringAsync: (value) => safeStorage.encryptStringAsync(value),
    decryptStringAsync: (value) => safeStorage.decryptStringAsync(value),
    ...(process.platform === 'linux'
      ? {
          getSelectedStorageBackend: () => safeStorage.getSelectedStorageBackend(),
        }
      : {}),
  });
  const assistant = createAssistantService(stateStore, secretStore, {
    getAppVersion: () => app.getVersion(),
  });
  // backgroundMode still persists in settings until step 5; it no longer hides the tray
  // or puts the island on the taskbar.
  const applyBackgroundMode = (_enabled: boolean) => {
    try {
      setWindowBackgroundMode(_enabled);
    } catch (error) {
      reportBackgroundModeError(error);
    }
    try {
      setTrayVisible(true);
    } catch (error) {
      reportBackgroundModeError(error);
    }
  };

  void app.whenReady().then(async () => {
    installBackgroundImageProtocol(
      async () => (await stateStore.load()).settings.backgroundImage,
      (error) => diagnosticsService.recordError('application', error),
    );
    diagnosticsService.record({ kind: 'app-lifecycle', phase: 'ready' });
    diagnosticsService.record({
      kind: 'platform-capabilities',
      packaged: app.isPackaged,
      displayCount: screen.getAllDisplays().length,
      scaleFactors: screen.getAllDisplays().map((display) => display.scaleFactor),
      mediaBackend:
        process.platform === 'win32'
          ? 'winrt'
          : process.platform === 'darwin'
            ? 'applescript'
            : 'mpris',
      inputBackend:
        process.platform === 'linux'
          ? 'x11-shape'
          : process.platform === 'win32'
            ? 'windows-cursor-region'
            : 'mouse-passthrough',
      sessionType:
        process.platform === 'win32'
          ? 'windows'
          : process.platform === 'darwin'
            ? 'macos'
            : process.env.XDG_SESSION_TYPE === 'wayland'
              ? 'wayland'
              : process.env.DISPLAY
                ? 'x11'
                : 'unknown',
      secureStorage: await safeStorage.isAsyncEncryptionAvailable().catch((error) => {
        diagnosticsService.recordError('application', error);
        return false;
      }),
    });
    powerMonitor.on('suspend', () =>
      diagnosticsService.record({ kind: 'app-lifecycle', phase: 'suspend' }),
    );
    powerMonitor.on('resume', () =>
      diagnosticsService.record({ kind: 'app-lifecycle', phase: 'resume' }),
    );
    screen.on('display-added', () =>
      diagnosticsService.record({ kind: 'app-lifecycle', phase: 'display-added' }),
    );
    screen.on('display-removed', () =>
      diagnosticsService.record({ kind: 'app-lifecycle', phase: 'display-removed' }),
    );
    screen.on('display-metrics-changed', () =>
      diagnosticsService.record({ kind: 'app-lifecycle', phase: 'display-metrics-changed' }),
    );
    let initialState = defaultAppState;
    try {
      initialState = await stateStore.load();
      const loadError = stateStore.getLoadError();
      if (loadError) {
        diagnosticsService.recordError('application', loadError);
        notices.report(
          'stateLoadFailed',
          loadError instanceof Error ? loadError.message : String(loadError),
        );
      }
    } catch (error) {
      diagnosticsService.recordError('application', error);
      notices.report(
        'stateLoadFailed',
        error instanceof Error ? error.message : String(error),
        'error',
        'system',
      );
    }

    applyBackgroundMode(initialState.settings.backgroundMode);
    configureSettingsWindow({
      diagnostics: diagnosticsService,
      onLoadError: reportWindowLoadError,
    });
    closeMedia = registerIPC({
      stateStore,
      secretStore,
      assistant,
      notices,
      diagnostics: diagnosticsService,
      applyBackgroundMode,
    });
    initializeLinuxInputShape(diagnosticsService, reportInputShapeError);
    createWindow(diagnosticsService, reportWindowLoadError);
    startupComplete = true;
  });

  app.on('before-quit', () => {
    diagnosticsService.record({ kind: 'app-lifecycle', phase: 'before-quit' });
    closeInputConnection();
    closeMedia();
    stateStore.close();
  });
  app.on('window-all-closed', () => {
    diagnosticsService.record({ kind: 'app-lifecycle', phase: 'window-all-closed' });
    // Island stays alive in the background; quit only when nothing is left to interact with.
    if (shouldQuitAfterLastWindow({ platform: process.platform, hasTray: hasTray() })) app.quit();
  });
}
