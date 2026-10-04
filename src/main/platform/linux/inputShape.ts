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
interface XDisplay {
  client: {
    require(name: string, cb: (error: Error | null, shape: Shape) => void): void;
    terminate(): void;
  };
}
export function createLinuxInputShape(getWindow: () => BrowserWindow | null, onReady: () => void) {
  let mainWindowInputShapeReady = false;
  let x11Display: XDisplay | null = null;
  let x11Shape: Shape | null = null;
  let pendingInputShape: InputRect | null = null;
  let inputShapeCheckPending = false;

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
        console.error('Failed to read Linux window input shape:', error);
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
        console.error('Linux window input shape still covers the full window:', result.rectangles);
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
        console.error('Failed to connect to X11 for input shaping:', error);
        return;
      }

      display.client.on('error', (clientError) => {
        console.error('X11 input-shape connection error:', clientError);
      });
      (display as unknown as XDisplay).client.require('shape', (shapeError, shape) => {
        if (shapeError) {
          console.error('X11 Shape extension is unavailable:', shapeError);
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
    initialize,
    isReady: () => mainWindowInputShapeReady,
    reset: () => {
      mainWindowInputShapeReady = false;
      inputShapeCheckPending = false;
      pendingInputShape = null;
    },
    close: () => x11Display?.client.terminate(),
  };
}
