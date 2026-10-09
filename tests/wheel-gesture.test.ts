import { expect, it } from 'vitest';
import {
  isClearVerticalSample,
  isResumedWheelPush,
  isVerticalStroke,
  isVerticalTakeover,
  wheelEventAxis,
} from '../src/renderer/lib/wheelGesture';
it('gives diagonals to vertical scrolling and keeps the drift a swipe carries', () => {
  expect(wheelEventAxis(30, 32)).toBe('vertical');
  expect(wheelEventAxis(30, 12)).toBe('vertical');
  expect(wheelEventAxis(200, 20)).toBe('horizontal');
  expect(wheelEventAxis(0, 1)).toBe('vertical');
  expect(wheelEventAxis(200, 1)).toBe('horizontal');
  expect(wheelEventAxis(-40, -1)).toBe('horizontal');
  expect(wheelEventAxis(1, 0)).toBe('horizontal');
  expect(wheelEventAxis(0, 0)).toBe('none');
});
it('only locks a stroke away from the rail when the vertical axis dominates', () => {
  // A vertical scroll owns the stroke, and so does a single clearly vertical sample.
  expect(isVerticalStroke(4, 120)).toBe(true);
  expect(isClearVerticalSample(200, 60)).toBe(true);
  expect(isClearVerticalSample(2, 120)).toBe(true);
  // Short vertical movement is not enough yet.
  expect(isVerticalStroke(1, 8)).toBe(false);
  // Drift on a sideways sample never qualifies, however large the swipe is.
  expect(isClearVerticalSample(9, 3)).toBe(false);
  expect(isClearVerticalSample(200, 12)).toBe(false);
  // A sideways swipe never qualifies, however far it has travelled.
  expect(isVerticalStroke(40, 6)).toBe(false);
  expect(isVerticalStroke(138, 21)).toBe(false);
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
