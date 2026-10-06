import { createLinuxInputShape } from './platform/linux/inputShape';
import { app, BrowserWindow, screen } from 'electron';
import type { Display } from 'electron';
import path from 'node:path';

import { getIconPath } from './assets';
import type { DiagnosticsService } from './services/diagnostics';
import { attachWindowDiagnostics, recordRendererReady } from './services/windowDiagnostics';
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string;
if (process.platform === 'linux') {
  app.commandLine.appendSwitch('enable-transparent-visuals');
}
let mainWindow: BrowserWindow | null = null;
let activeDiagnostics: DiagnosticsService | null = null;
let mainWindowReady = false;
let rendererIsReady = false;
let backgroundMode = false;
let linuxDisplaySyncInstalled = false;
export const getWindowBoundsForDisplay = (display: Display) => {
  const workArea = display.workArea;
  return process.platform === 'linux' && workArea.width > 0 && workArea.height > 0
    ? workArea
    : display.bounds;
};
const syncLinuxWindowToDisplay = () => {
  if (process.platform !== 'linux' || !mainWindow || mainWindow.isDestroyed()) return;
  const currentBounds = mainWindow.getBounds();
  const displayBounds = getWindowBoundsForDisplay(screen.getDisplayMatching(currentBounds));
  if (
    currentBounds.x !== displayBounds.x ||
    currentBounds.y !== displayBounds.y ||
    currentBounds.width !== displayBounds.width ||
    currentBounds.height !== displayBounds.height
  ) {
    mainWindow.setBounds(displayBounds);
  }
};
const installLinuxDisplaySync = () => {
  if (process.platform !== 'linux' || linuxDisplaySyncInstalled) return;
  linuxDisplaySyncInstalled = true;
  screen.on('display-metrics-changed', (_event, display, changedMetrics) => {
    if (
      !changedMetrics.includes('bounds') &&
      !changedMetrics.includes('workArea') &&
      !changedMetrics.includes('scaleFactor')
    ) {
      return;
    }
    if (mainWindow && screen.getDisplayMatching(mainWindow.getBounds()).id === display.id) {
      syncLinuxWindowToDisplay();
    }
  });
  screen.on('display-removed', () => syncLinuxWindowToDisplay());
};
const applySkipTaskbar = () => {
  if (!mainWindow) return;
  if (process.platform === 'linux') inputShape.setSkipTaskbar(backgroundMode);
  else mainWindow.setSkipTaskbar(backgroundMode);
};
export const showMainWindow = () => {
  if (!mainWindow || !mainWindowReady || !rendererIsReady) return;
  if (process.platform === 'linux' && !inputShape.isReady()) return;

  syncLinuxWindowToDisplay();
  mainWindow.show();
  applySkipTaskbar();
  mainWindow.setAlwaysOnTop(true, process.platform === 'linux' ? 'screen-saver' : 'pop-up-menu');
  mainWindow.focus();
};

export const markRendererReady = () => {
  rendererIsReady = true;
  if (mainWindow && activeDiagnostics) recordRendererReady(mainWindow, activeDiagnostics);
  showMainWindow();
};

export const createWindow = (
  diagnostics: DiagnosticsService,
  onLoadError: (error: unknown) => void = () => {},
) => {
  activeDiagnostics = diagnostics;
  installLinuxDisplaySync();
  mainWindowReady = false;
  rendererIsReady = false;
  inputShape.reset();
  const isLinux = process.platform === 'linux';
  const isWindows = process.platform === 'win32';
  const isMac = process.platform === 'darwin';
  const primaryDisplay = screen.getPrimaryDisplay();
  const { x, y, width, height } = getWindowBoundsForDisplay(primaryDisplay);

  const winWidth = width;
  const winHeight = height;
  const winX = x;
  const winY = y;

  // Electron's panel window type is macOS-only; Linux uses a normal X11 window.
  const windowType = isWindows ? 'toolbar' : isMac ? 'panel' : undefined;

  mainWindow = new BrowserWindow({
    width: winWidth,
    height: winHeight,
    x: winX,
    y: winY,
    backgroundColor: '#00000000',
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    frame: false,
    ...(isWindows ? {} : { thickFrame: false }),
    hasShadow: false,
    skipTaskbar: backgroundMode,
    icon: getIconPath(),
    ...(isMac ? { hiddenInMissionControl: true } : {}),
    ...(windowType ? { type: windowType } : {}),
    fullscreen: false,
    acceptFirstMouse: true,
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.cjs'),
      devTools: false,
    },
    show: false,
  });
  attachWindowDiagnostics(mainWindow, diagnostics);

  if (!isLinux) {
    mainWindow.setIgnoreMouseEvents(true, { forward: true });
  } else {
    mainWindow.setIgnoreMouseEvents(false);
    mainWindow.on('move', syncLinuxWindowToDisplay);
    mainWindow.on('resize', syncLinuxWindowToDisplay);
  }

  mainWindow.once('ready-to-show', () => {
    mainWindowReady = true;
    syncLinuxWindowToDisplay();
    showMainWindow();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  try {
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  } catch {}

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    void mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL).catch(onLoadError);
  } else {
    const rendererPath = path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`);
    void mainWindow.loadFile(rendererPath).catch(onLoadError);
  }
};

export const getMainWindow = () => mainWindow;
export const setWindowBackgroundMode = (enabled: boolean) => {
  backgroundMode = enabled;
  applySkipTaskbar();
};
const inputShape = createLinuxInputShape(() => mainWindow, showMainWindow);
export const initializeLinuxInputShape = (
  diagnostics: DiagnosticsService,
  onError?: (error: unknown) => void,
) => {
  inputShape.setDiagnostics(diagnostics);
  if (onError) inputShape.setErrorHandler(onError);
  inputShape.initialize();
};
export const applyLinuxInputShape = inputShape.apply;
export const closeInputConnection = inputShape.close;
