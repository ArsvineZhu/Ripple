import { expect, it } from 'vitest';
import {
  isResumedWheelPush,
  isVerticalTakeover,
  wheelEventAxis,
} from '../src/renderer/lib/wheelGesture';
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
it('resumes only after a decayed tail and a clear rising run', () => {
  // A momentum tail only decays, so nothing in it may look like a new push.
  expect(
    isResumedWheelPush({ magnitude: 12, lastMagnitude: 40, peakMagnitude: 40, risingSamples: 3 }),
  ).toBe(false);
  // A rise inside the stroke's own ramp is not a gesture boundary either.
  expect(
    isResumedWheelPush({ magnitude: 30, lastMagnitude: 18, peakMagnitude: 30, risingSamples: 2 }),
  ).toBe(false);
  // A single rise is not enough, and the tail must have decayed against the peak.
  expect(
    isResumedWheelPush({ magnitude: 20, lastMagnitude: 10, peakMagnitude: 40, risingSamples: 1 }),
  ).toBe(false);
  // A smooth climb after the tail has decayed is the next push, even without an input gap.
  expect(
    isResumedWheelPush({ magnitude: 20, lastMagnitude: 10, peakMagnitude: 40, risingSamples: 2 }),
  ).toBe(true);
});
