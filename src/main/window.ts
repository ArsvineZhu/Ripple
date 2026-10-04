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
export const showMainWindow = () => {
  if (!mainWindow || !mainWindowReady) return;
  if (process.platform === 'linux' && !inputShape.isReady()) return;

  mainWindow.show();
  mainWindow.setAlwaysOnTop(true, process.platform === 'linux' ? 'screen-saver' : 'pop-up-menu');
  mainWindow.focus();
};

export const createWindow = () => {
  mainWindowReady = false;
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
    skipTaskbar: true,
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
    show: !isLinux,
  });

  if (!isLinux) {
    mainWindow.setIgnoreMouseEvents(true, { forward: true });
  } else {
    mainWindow.setIgnoreMouseEvents(false);
  }

  const showDelay = isLinux ? 500 : 0;

  mainWindow.once('ready-to-show', () => {
    setTimeout(() => {
      mainWindowReady = true;
      showMainWindow();
    }, showDelay);
  });

  setTimeout(() => {
    if (mainWindow && !mainWindow.isVisible()) {
      mainWindowReady = true;
      showMainWindow();
    }
  }, 5000);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  try {
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  } catch {}

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    void mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    const rendererPath = path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`);
    void mainWindow.loadFile(rendererPath);
  }
};

export const getMainWindow = () => mainWindow;
const inputShape = createLinuxInputShape(() => mainWindow, showMainWindow);
export const initializeLinuxInputShape = inputShape.initialize;
export const applyLinuxInputShape = inputShape.apply;
export const closeInputConnection = inputShape.close;
