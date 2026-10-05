import type { BrowserWindow } from 'electron';
import x11Module from 'x11';
import type { InputRect } from '../../../shared/contracts';
import { toDeviceRectangle } from '../../../shared/inputGeometry';
interface Shape {
  Op: { Set: number };
  Kind: { Input: number };
  Ordering: { Unsorted: number };
  Rectangles(
    op: number,
    kind: number,
    window: number,
    x: number,
    y: number,
    rects: number[][],
    ordering: number,
  ): void;
  GetRectangles(
    window: number,
    kind: number,
    cb: (error: Error | null, result: { rectangles: number[][] }) => void,
  ): void;
}
interface X11Client {
  require(name: string, cb: (error: Error | null, shape: Shape) => void): void;
  terminate(): void;
  InternAtom(
    onlyIfExists: boolean,
    name: string,
    cb: (error: Error | null, atom: number) => void,
  ): void;
  SendClientMessage(
    destination: number,
    window: number,
    messageType: number,
    format: number,
    data: number[],
    eventMask: number,
    cb: (error: Error | null) => void,
  ): void;
}
interface XDisplay {
  client: X11Client;
  screen: Array<{ root: number }>;
}
const EWMH_SUBSTRUCTURE_EVENT_MASK = 0x00080000 | 0x00100000;
export function createLinuxInputShape(getWindow: () => BrowserWindow | null, onReady: () => void) {
  let errorHandler = (error: unknown) => console.error('Linux input shape error:', error);
  let mainWindowInputShapeReady = false;
  let x11Display: XDisplay | null = null;
  let x11Shape: Shape | null = null;
  let pendingInputShape: InputRect | null = null;
  let inputShapeCheckPending = false;
  let skipTaskbar = false;
  let taskbarAtoms: Promise<[number, number]> | null = null;

  const internAtom = (name: string) =>
    new Promise<number>((resolve, reject) => {
      if (!x11Display) {
        reject(new Error('X11 connection is unavailable'));
        return;
      }
      x11Display.client.InternAtom(false, name, (error, atom) => {
        if (error) reject(error);
        else resolve(atom);
      });
    });

  const applyTaskbarState = () => {
    const mainWindow = getWindow();
    const display = x11Display;
    if (
      !mainWindow ||
      process.platform !== 'linux' ||
      !display ||
      !mainWindow.isVisible() ||
      !display.screen[0]
    )
      return;

    const hidden = skipTaskbar;
    const windowId = mainWindow.getNativeWindowHandle().readUInt32LE(0);
    taskbarAtoms ??= Promise.all([
      internAtom('_NET_WM_STATE'),
      internAtom('_NET_WM_STATE_SKIP_TASKBAR'),
    ]);
    void taskbarAtoms
      .then(([stateAtom, skipTaskbarAtom]) => {
        if (
          mainWindow.isDestroyed() ||
          getWindow() !== mainWindow ||
          x11Display !== display ||
          !mainWindow.isVisible()
        )
          return;
        display.client.SendClientMessage(
          display.screen[0]!.root,
          windowId,
          stateAtom,
          32,
          [hidden ? 1 : 0, skipTaskbarAtom, 0, 1, 0],
          EWMH_SUBSTRUCTURE_EVENT_MASK,
          (error) => {
            if (error) errorHandler(error);
          },
        );
      })
      .catch(errorHandler);
  };

  const apply = (rect: InputRect) => {
    const mainWindow = getWindow();
    if (!mainWindow || process.platform !== 'linux') return;

    pendingInputShape = rect;
    // Keep the visual window rectangular and transparent. Changing ShapeBounding
    // on every animation frame races the compositor and can flash a black edge;
    // only ShapeInput is needed to let clicks pass through outside the Island.
    if (!x11Display || !x11Shape) return;

    const windowId = mainWindow.getNativeWindowHandle().readUInt32LE(0);
    const inputRect = toDeviceRectangle(rect);

    x11Shape.Rectangles(
      x11Shape.Op.Set,
      x11Shape.Kind.Input,
      windowId,
      0,
      0,
      [inputRect],
      x11Shape.Ordering.Unsorted,
    );

    if (mainWindowInputShapeReady || inputShapeCheckPending) return;
    inputShapeCheckPending = true;
    x11Shape.GetRectangles(windowId, x11Shape.Kind.Input, (error, result) => {
      inputShapeCheckPending = false;
      if (error) {
        errorHandler(error);
        return;
      }

      if (mainWindow.isDestroyed() || getWindow() !== mainWindow) return;
      const actual = result.rectangles?.[0];
      const bounds = mainWindow?.getBounds();
      const scale = rect.scaleFactor || 1;
      if (
        !actual ||
        !bounds ||
        actual[2] >= bounds.width * scale ||
        actual[3] >= bounds.height * scale
      ) {
        errorHandler(new Error('Linux window input shape still covers the full window'));
        return;
      }

      mainWindowInputShapeReady = true;
      onReady();
    });
  };

  const initialize = () => {
    if (process.platform !== 'linux') return;

    x11Module.createClient((error, display) => {
      if (error) {
        errorHandler(error);
        return;
      }

      display.client.on('error', (clientError) => {
        errorHandler(clientError);
      });
      (display as unknown as XDisplay).client.require('shape', (shapeError, shape) => {
        if (shapeError) {
          errorHandler(shapeError);
          display.client.terminate();
          return;
        }

        x11Display = display as unknown as XDisplay;
        x11Shape = shape;
        if (pendingInputShape) apply(pendingInputShape);
      });
    });
  };

  return {
    apply,
    setSkipTaskbar: (hidden: boolean) => {
      skipTaskbar = hidden;
      applyTaskbarState();
    },
    initialize,
    isReady: () => mainWindowInputShapeReady,
    setErrorHandler: (handler: (error: unknown) => void) => {
      errorHandler = handler;
    },
    reset: () => {
      mainWindowInputShapeReady = false;
      inputShapeCheckPending = false;
      pendingInputShape = null;
    },
    close: () => x11Display?.client.terminate(),
  };
}
