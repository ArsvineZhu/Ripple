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
  const input = (_event: unknown, value: unknown) => {
    if (closed || contents.isDestroyed() || !value || typeof value !== 'object') return;
    // Chromium sends this when a fresh touchpad gesture takes over a fling.
    // Forward only its boundary, never keys, pointer coordinates or wheel data.
    if ('type' in value && value.type === 'gestureFlingCancel') {
      contents.send('scroll-gesture-start', { at: Date.now() });
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
