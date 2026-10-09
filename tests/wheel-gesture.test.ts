import { expect, it } from 'vitest';
import { isVerticalTakeover, wheelEventAxis } from '../src/renderer/lib/wheelGesture';
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
it('only hands a horizontal stroke over to a real diagonal', () => {
  // Drift a sideways swipe carries stays on the rail.
  expect(isVerticalTakeover(25, 4)).toBe(false);
  expect(isVerticalTakeover(40, 6)).toBe(false);
  expect(isVerticalTakeover(200, 12)).toBe(false);
  // A diagonal, or vertical movement on its own, takes the stroke over.
  expect(isVerticalTakeover(30, 32)).toBe(true);
  expect(isVerticalTakeover(20, 40)).toBe(true);
  expect(isVerticalTakeover(1, 40)).toBe(true);
});
