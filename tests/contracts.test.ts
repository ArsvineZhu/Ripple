import { describe, expect, it } from 'vitest';
import { parseCommand, tokenizeArgs } from '../src/main/platform/windows/commands';
import {
  visibleTabIds,
  nextTabId,
  largeTabWidth,
  largeTabHeight,
} from '../src/renderer/lib/navigation';
import {
  advanceWheelStream,
  clampTrack,
  classifyWheel,
  interpolatePageSize,
  pageTargets,
  settleTrack,
  settleWheelStream,
  updateWheelGesture,
  wheelContentDelta,
} from '../src/renderer/lib/pageSwipe';
import { modeReducer, resolveMode } from '../src/renderer/lib/modes';
import { islandInputRectangle, toDeviceRectangle } from '../src/shared/inputGeometry';
import { noticeAreaForCode, noticeAreaForPatch } from '../src/shared/contracts';

describe('Windows application commands', () => {
  it('preserves quoted paths and mid-token argument quotes', () => {
    expect(parseCommand('"C:\\Program Files\\App\\app.exe" --flag="hello world" --bare')).toEqual({
      exe: 'C:\\Program Files\\App\\app.exe',
      args: ['--flag=hello world', '--bare'],
    });
    expect(parseCommand('C:\\Program Files\\App\\app.exe "hello world"')).toEqual({
      exe: 'C:\\Program Files\\App\\app.exe',
      args: ['hello world'],
    });
    expect(tokenizeArgs('"quoted arg" --bare')).toEqual(['quoted arg', '--bare']);
  });
  it('retains unknown environment variables and expands known ones', () => {
    const key = 'RIPPLE_COMMAND_TEST_ROOT';
    process.env[key] = 'C:\\Apps';
    try {
      expect(parseCommand(`%${key}%/app.exe`)).toEqual({ exe: 'C:\\Apps\\app.exe', args: [] });
      expect(parseCommand('%RIPPLE_UNKNOWN%')).toEqual({ exe: '%RIPPLE_UNKNOWN%', args: [] });
    } finally {
      delete process.env[key];
    }
  });
});

describe('Island navigation and modes', () => {
  it('keeps configured order, hidden tabs and media availability', () => {
    const visible = visibleTabIds([7, 3, 0, 6, 1, 2, 4, 5], [1, 4], false);
    expect(visible).toEqual([7, 0, 6, 2, 5]);
    expect(nextTabId(visible, 5, 1)).toBe(7);
    expect(nextTabId(visible, 7, -1)).toBe(5);
    expect(visibleTabIds([3, 0], [], true)).toEqual([3, 0]);
    expect(visibleTabIds([7, 3, 0], [7], false)).toEqual([7, 0]);
    expect(nextTabId([], 2, 1)).toBe(2);
  });
  it('settles the follow swipe rail by projected distance or fling velocity', () => {
    const targets = { previous: 405, following: 380 };
    expect(settleTrack({ targets, x: 100, velocity: 0 })).toEqual({ target: 0, direction: 0 });
    expect(settleTrack({ targets, x: 210, velocity: 0 })).toEqual({ target: 405, direction: -1 });
    expect(settleTrack({ targets, x: -150, velocity: -300 })).toEqual({
      target: -380,
      direction: 1,
    });
    expect(settleTrack({ targets, x: 150, velocity: -900 })).toEqual({
      target: -380,
      direction: 1,
    });
    expect(
      settleTrack({ targets: { previous: 405, following: 0 }, x: -300, velocity: 0 }).direction,
    ).toBe(0);
  });
  it('moves wheel content with the fingers and keeps one gesture within one page', () => {
    const targets = { previous: 405, following: 380 };
    expect(wheelContentDelta(-12, 0)).toBe(12);
    expect(wheelContentDelta(2, 1)).toBe(-80);
    expect(clampTrack(900, targets)).toBe(405);
    expect(clampTrack(-900, targets)).toBe(-380);
    expect(largeTabWidth(7, null)).toBe(495);
    expect(largeTabWidth(7, 610)).toBe(610);
    expect(largeTabHeight(7, 'free')).toBe(425);
    expect(largeTabHeight(7, 'top-center')).toBe(345);
  });
  it('pages by the previous width to the left and the current width to the right', () => {
    expect(pageTargets({ previous: 405, current: 380, following: 330 })).toEqual({
      previous: 405,
      following: 380,
    });
    expect(pageTargets({ previous: null, current: 380, following: null })).toEqual({
      previous: 0,
      following: 0,
    });
  });
  it('interpolates the shell size from the rail progress at p = 0, 0.5 and 1', () => {
    const size = {
      targets: { previous: 405, following: 380 },
      base: { width: 380, height: 190 },
      current: { width: 380, height: 190 },
      previous: { width: 405, height: 120 },
      following: { width: 480, height: 210 },
    };
    expect(interpolatePageSize({ ...size, x: 0 })).toEqual({ width: 380, height: 190 });
    expect(interpolatePageSize({ ...size, x: -190 })).toEqual({ width: 430, height: 200 });
    expect(interpolatePageSize({ ...size, x: -380 })).toEqual({ width: 480, height: 210 });
    expect(interpolatePageSize({ ...size, x: 202.5 })).toEqual({ width: 392.5, height: 155 });
    expect(interpolatePageSize({ ...size, x: 405 })).toEqual({ width: 405, height: 120 });
    // A shell still springing elsewhere keeps its offset while paging.
    expect(interpolatePageSize({ ...size, base: { width: 300, height: 100 }, x: -380 })).toEqual({
      width: 400,
      height: 120,
    });
  });
  it('treats a momentum tail as part of its settled gesture', () => {
    let stream = advanceWheelStream(null, 'new', 0, -40);
    expect(classifyWheel(stream, 16, -40)).toBe('continue');
    stream = { ...advanceWheelStream(stream, 'continue', 16, -40), settled: true };
    expect(classifyWheel(stream, 32, -30)).toBe('ignore');
    stream = advanceWheelStream(stream, 'ignore', 32, -30);
    stream = advanceWheelStream(stream, 'ignore', 48, -12);
    expect(classifyWheel(stream, 64, -8)).toBe('ignore');
    expect(classifyWheel(stream, 64, -40)).toBe('new');
    expect(classifyWheel(stream, 64, 6)).toBe('new');
    expect(classifyWheel(stream, 300, -8)).toBe('new');
  });
  it('keeps a drifting swipe on the rail and leaves a vertical scroll alone', () => {
    // 30px across with 32px down is a swipe on the rail, not a scroll.
    const drifting = updateWheelGesture(null, 0, -30, -32);
    expect(drifting.stream.axis).toBe('horizontal');
    expect(drifting.movement).toBe(-30);
    // A mostly vertical two-finger scroll never moves the rail.
    const scrolling = updateWheelGesture(null, 0, -2, -32);
    expect(scrolling.stream.axis).toBe('vertical');
    expect(scrolling.movement).toBe(0);
    // Movement gathered before the axis is decided lands on the event that decides it.
    const undecided = updateWheelGesture(null, 0, -3, -3);
    expect(undecided.stream.axis).toBeNull();
    expect(undecided.movement).toBe(0);
    const decided = updateWheelGesture(undecided.stream, 16, -9, -1);
    expect(decided.stream.axis).toBe('horizontal');
    expect(decided.movement).toBe(-12);
  });
  it('resumes a settled stream only for a clear re-acceleration above its tail', () => {
    let stream = advanceWheelStream(null, 'new', 0, -40);
    stream = { ...stream, settled: true };
    stream = advanceWheelStream(stream, 'ignore', 16, -30);
    stream = advanceWheelStream(stream, 'ignore', 32, -12);
    // Coming back up to the current tail is still momentum.
    expect(classifyWheel(stream, 48, -8)).toBe('ignore');
    // Rising clearly above the decayed tail is a new swipe.
    expect(classifyWheel(stream, 48, -24)).toBe('new');
    // A tail that only decays never resumes, however long it lasts.
    let decaying = { ...advanceWheelStream(null, 'new', 0, -40), settled: true };
    let time = 0;
    for (const abs of [36, 32, 28, 24, 20, 16, 12, 8, 4, 2, 1]) {
      time += 16;
      expect(classifyWheel(decaying, time, -abs)).toBe('ignore');
      decaying = advanceWheelStream(decaying, 'ignore', time, -abs);
    }
  });
  it('measures a settled tail from the event that settled it', () => {
    // A fast swipe peaks long after its first, smallest event.
    let stream = advanceWheelStream(null, 'new', 0, -8);
    let time = 0;
    for (const abs of [20, 34, 50, 70, 92, 110, 120]) {
      time += 16;
      stream = advanceWheelStream(stream, 'continue', time, -abs);
    }
    const settled = settleWheelStream(stream);
    expect(settled.settled).toBe(true);
    expect(settled.tailAbs).toBe(120);
    expect(settled.resume).toBe(0);
    // A tail below the settling event never resumes, however long it decays for.
    let tail = settled;
    for (const abs of [115, 105, 95, 85, 75, 66, 58, 50, 43, 36, 30, 24, 19, 14, 10, 6, 3]) {
      time += 16;
      expect(classifyWheel(tail, time, -abs)).toBe('ignore');
      tail = advanceWheelStream(tail, 'ignore', time, -abs);
    }
  });
  it('preserves standby precedence and explicit expansion', () => {
    expect(resolveMode('still', true, true)).toBe('quick');
    expect(resolveMode('still', false, true)).toBe('large');
    expect(resolveMode('large', true, false)).toBe('large');
    expect(modeReducer('quick', (mode) => (mode === 'large' ? 'quick' : 'large'))).toBe('large');
  });
});

describe('Linux input geometry', () => {
  it('uses physical coordinates and rounds outward for fractional display scaling', () => {
    expect(
      toDeviceRectangle({ x: 10.5, y: 5.5, width: 170.2, height: 40.2, scaleFactor: 1.5 }),
    ).toEqual([15, 8, 256, 61]);
  });
  it('keeps input padding inside the viewport while leaving the visual bounding shape alone', () => {
    expect(
      islandInputRectangle(
        { left: 5, top: 20, right: 175, bottom: 60 },
        { width: 1920, height: 1200 },
        2,
      ),
    ).toEqual({ x: 0, y: 0, width: 203, height: 88, scaleFactor: 2 });
  });
});

describe('inline notice routing', () => {
  it('routes failures to the feature that owns the affected interaction', () => {
    expect(noticeAreaForCode('appLaunchFailed')).toBe('workflows');
    expect(noticeAreaForCode('windowLoadFailed')).toBe('system');
    expect(noticeAreaForPatch({ tasks: [] })).toBe('tasks');
    expect(noticeAreaForPatch({ workflows: [] })).toBe('workflows');
    expect(noticeAreaForPatch({ quickApps: [] })).toBe('quick-apps');
    expect(noticeAreaForPatch({ settings: { timeZone: 'UTC' } })).toBe('settings');
  });
});

describe('inline notice routing', () => {
  it('routes notices to the feature that can explain or resolve them', () => {
    expect(noticeAreaForCode('appLaunchFailed')).toBe('workflows');
    expect(noticeAreaForCode('windowLoadFailed')).toBe('system');
    expect(noticeAreaForPatch({ tasks: [] })).toBe('tasks');
    expect(noticeAreaForPatch({ workflows: [] })).toBe('workflows');
    expect(noticeAreaForPatch({ quickApps: [] })).toBe('quick-apps');
    expect(noticeAreaForPatch({ settings: { timeZone: 'UTC' } })).toBe('settings');
  });
});
