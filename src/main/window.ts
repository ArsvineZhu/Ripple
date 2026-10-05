import { createLinuxInputShape } from './platform/linux/inputShape';
import { app, BrowserWindow, screen } from 'electron';
import path from 'node:path';

import { getIconPath } from './assets';
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string;
if (process.platform === 'linux') {
  app.commandLine.appendSwitch('enable-transparent-visuals');
}
let mainWindow: BrowserWindow | null = null;
let mainWindowReady = false;
let rendererIsReady = false;
let backgroundMode = false;
const applySkipTaskbar = () => {
  if (!mainWindow) return;
  if (process.platform === 'linux') inputShape.setSkipTaskbar(backgroundMode);
  else mainWindow.setSkipTaskbar(backgroundMode);
};
export const showMainWindow = () => {
  if (!mainWindow || !mainWindowReady || !rendererIsReady) return;
  if (process.platform === 'linux' && !inputShape.isReady()) return;

  mainWindow.show();
  applySkipTaskbar();
  mainWindow.setAlwaysOnTop(true, process.platform === 'linux' ? 'screen-saver' : 'pop-up-menu');
  mainWindow.focus();
};

export const markRendererReady = () => {
  rendererIsReady = true;
  showMainWindow();
};

export const createWindow = (onLoadError: (error: unknown) => void = () => {}) => {
  mainWindowReady = false;
  rendererIsReady = false;
  inputShape.reset();
  const primaryDisplay = screen.getPrimaryDisplay();
  const { x, y, width, height } = primaryDisplay.bounds;
  const isLinux = process.platform === 'linux';
  const isWindows = process.platform === 'win32';
  const isMac = process.platform === 'darwin';

  const winWidth = width;
  const winHeight = height;
  const winX = x;
  const winY = y;

  const windowType = isWindows ? 'toolbar' : 'panel';

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

  if (!isLinux) {
    mainWindow.setIgnoreMouseEvents(true, { forward: true });
  } else {
    mainWindow.setIgnoreMouseEvents(false);
  }

  mainWindow.once('ready-to-show', () => {
    mainWindowReady = true;
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
export const initializeLinuxInputShape = (onError?: (error: unknown) => void) => {
  if (onError) inputShape.setErrorHandler(onError);
  inputShape.initialize();
};
export const applyLinuxInputShape = inputShape.apply;
export const closeInputConnection = inputShape.close;
