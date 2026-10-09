import { EventEmitter } from 'node:events';
import { expect, it, vi } from 'vitest';
import { installScrollGestureBridge } from '../src/main/services/scrollGestures';

it('forwards fresh gesture boundaries only and removes its listener once', () => {
  const contents = Object.assign(new EventEmitter(), { isDestroyed: () => false, send: vi.fn() });
  const close = installScrollGestureBridge(contents);
  contents.emit('input-event', {}, { type: 'mouseWheel', deltaX: 100 });
  contents.emit('input-event', {}, { type: 'keyDown', key: 'private' });
  expect(contents.send).not.toHaveBeenCalled();
  contents.emit('input-event', {}, { type: 'gestureFlingCancel', other: 'excluded' });
  expect(contents.send).toHaveBeenCalledWith('scroll-gesture-start', { at: expect.any(Number) });
  contents.emit('destroyed');
  close();
  expect(contents.listenerCount('input-event')).toBe(0);
  contents.emit('input-event', {}, { type: 'gestureFlingCancel' });
  expect(contents.send).toHaveBeenCalledTimes(1);
});
