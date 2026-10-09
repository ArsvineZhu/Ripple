import { expect, it } from 'vitest';
import { wheelEventAxis } from '../src/renderer/lib/wheelGesture';
it('gives diagonals to vertical scrolling and tolerates only tiny horizontal jitter', () => {
  expect(wheelEventAxis(30, 32)).toBe('vertical');
  expect(wheelEventAxis(30, 12)).toBe('vertical');
  expect(wheelEventAxis(200, 20)).toBe('vertical');
  expect(wheelEventAxis(0, 1)).toBe('vertical');
  expect(wheelEventAxis(200, 1)).toBe('horizontal');
  expect(wheelEventAxis(-40, -1)).toBe('horizontal');
  expect(wheelEventAxis(1, 0)).toBe('horizontal');
  expect(wheelEventAxis(0, 0)).toBe('none');
});
