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
