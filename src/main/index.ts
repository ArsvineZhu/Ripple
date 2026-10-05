import { app, safeStorage } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
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

app.setName('Ripple Next');
if (process.platform === 'win32') app.setAppUserModelId('com.arsvinezhu.ripple-next');

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  startApplication();
}

function startApplication() {
  const userDataPath = path.join(app.getPath('appData'), 'Ripple Next');
  fs.mkdirSync(userDataPath, { recursive: true, mode: 0o700 });
  app.setPath('userData', userDataPath);

  const stateStore = createAppStateStore(userDataPath);
  const secretStore = createSecretStore(stateStore, {
    isAsyncEncryptionAvailable: () => safeStorage.isAsyncEncryptionAvailable(),
    encryptStringAsync: (value) => safeStorage.encryptStringAsync(value),
    decryptStringAsync: (value) => safeStorage.decryptStringAsync(value),
    ...(process.platform === 'linux'
      ? { getSelectedStorageBackend: () => safeStorage.getSelectedStorageBackend() }
      : {}),
  });
  const notices = createNoticeBus();
  const assistant = createAssistantService(stateStore, secretStore);
  let backgroundMode = false;
  let startupComplete = false;

  const reportWindowLoadError = (error: unknown) => {
    const detail = error instanceof Error ? error.message : String(error);
    console.error('Could not load the Ripple Next window:', detail);
    notices.report('windowLoadFailed', detail);
  };
  const reportInputShapeError = (error: unknown) => {
    const detail = error instanceof Error ? error.message : String(error);
    console.error('Could not set up Linux click-through:', detail);
    notices.report('inputShapeFailed', detail);
  };
  const reportBackgroundModeError = (error: unknown) => {
    const detail = error instanceof Error ? error.message : String(error);
    notices.report('backgroundModeFailed', detail, 'warning', 'settings');
  };
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
        notices.report(
          'stateLoadFailed',
          loadError instanceof Error ? loadError.message : String(loadError),
        );
      }
    } catch (error) {
      notices.report(
        'stateLoadFailed',
        error instanceof Error ? error.message : String(error),
        'error',
        'system',
      );
    }

    applyBackgroundMode(initialState.settings.backgroundMode);
    registerIPC({ stateStore, secretStore, assistant, notices, applyBackgroundMode });
    initializeLinuxInputShape(reportInputShapeError);
    createWindow(reportWindowLoadError);
    startupComplete = true;
  });

  app.on('second-instance', () => {
    if (!startupComplete) return;
    if (getMainWindow()) showMainWindow();
    else createWindow(reportWindowLoadError);
  });

  app.on('activate', () => {
    if (!getMainWindow()) createWindow(reportWindowLoadError);
  });

  app.on('before-quit', () => {
    closeInputConnection();
    stateStore.close();
  });
  app.on('window-all-closed', () => {
    if (process.platform === 'linux' && !backgroundMode && !hasTray()) app.quit();
  });
}
