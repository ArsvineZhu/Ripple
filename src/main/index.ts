import { app, safeStorage } from 'electron';
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
  showMainWindow,
} from './window';
import { hasTray, setTrayVisible } from './tray';
import { createAppStateStore } from './services/appStateStore';
import { createSecretStore } from './services/secretStore';
import { createAssistantService } from './services/assistant';
import { createNoticeBus } from './services/noticeBus';
import { initializeDiagnostics, type DiagnosticsService } from './services/diagnostics';
import {
  installChildProcessDiagnostics,
  installFatalErrorMonitor,
} from './services/processDiagnostics';
import { setWindowsMediaErrorHandler } from './platform/windows/media';

app.setName('Ripple Next');
if (process.platform === 'win32') app.setAppUserModelId('com.arsvinezhu.ripple-next');

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
    if (getMainWindow()) showMainWindow();
    else createWindow(diagnostics, reportWindowLoadError);
  });
  app.on('activate', () => {
    if (!startupComplete || !diagnostics) return;
    if (!getMainWindow()) createWindow(diagnostics, reportWindowLoadError);
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
  setWindowsMediaErrorHandler((error) => diagnosticsService.recordError('media', error));
  installChildProcessDiagnostics(app, diagnosticsService);

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
  let backgroundMode = false;
  const applyBackgroundMode = (enabled: boolean) => {
    backgroundMode = enabled;
    try {
      setWindowBackgroundMode(enabled);
    } catch (error) {
      reportBackgroundModeError(error);
    }
    try {
      setTrayVisible(!enabled);
    } catch (error) {
      reportBackgroundModeError(error);
    }
    if (process.platform === 'darwin' && app.dock) {
      try {
        if (enabled) app.dock.hide();
        else void app.dock.show().catch(reportBackgroundModeError);
      } catch (error) {
        reportBackgroundModeError(error);
      }
    }
  };

  void app.whenReady().then(async () => {
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
    registerIPC({
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
    closeInputConnection();
    stateStore.close();
  });
  app.on('window-all-closed', () => {
    if (process.platform === 'linux' && !backgroundMode && !hasTray()) app.quit();
  });
}
