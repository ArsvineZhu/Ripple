import { describe, expect, it } from 'vitest';
import { parseCommand, tokenizeArgs } from '../src/main/platform/windows/commands';
import { visibleTabIds, nextTabId } from '../src/renderer/lib/navigation';
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
