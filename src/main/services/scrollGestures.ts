import type { ScrollGestureStart } from '../../shared/contracts';

interface ScrollGestureSource {
  on(event: string, listener: (...args: unknown[]) => void): unknown;
  once(event: string, listener: (...args: unknown[]) => void): unknown;
  removeListener(event: string, listener: (...args: unknown[]) => void): unknown;
  isDestroyed(): boolean;
  send(channel: string, payload: ScrollGestureStart): void;
}

export function installScrollGestureBridge(contents: ScrollGestureSource): () => void {
  let closed = false;
  let lastBoundary: { type: string; at: number } | null = null;
  const input = (_event: unknown, value: unknown) => {
    if (closed || contents.isDestroyed() || !value || typeof value !== 'object') return;
    // ScrollBegin also covers fresh gestures without a prior fling. Chromium
    // may emit FlingCancel + ScrollBegin as one pair; forward that boundary once.
    if (
      'type' in value &&
      (value.type === 'gestureFlingCancel' || value.type === 'gestureScrollBegin')
    ) {
      const now = Date.now();
      if (lastBoundary && lastBoundary.type !== value.type && now - lastBoundary.at <= 50) {
        lastBoundary = null;
        return;
      }
      lastBoundary = { type: value.type, at: now };
      contents.send('scroll-gesture-start', { at: now });
    }
  };
  const close = () => {
    if (closed) return;
    closed = true;
    contents.removeListener('input-event', input);
    contents.removeListener('destroyed', close);
  };
  contents.on('input-event', input);
  contents.once('destroyed', close);
  return close;
}
