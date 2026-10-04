import { describe, expect, it } from 'vitest';
import { parseCommand, tokenizeArgs } from '../src/main/platform/windows/commands';
import { createStorage } from '../src/renderer/lib/storage';
import { visibleTabIds, nextTabId } from '../src/renderer/lib/navigation';
import { modeReducer, resolveMode } from '../src/renderer/lib/modes';
import { islandInputRectangle, toDeviceRectangle } from '../src/shared/inputGeometry';

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

describe('existing persisted data', () => {
  it('reads legacy string quick apps and existing tasks/workflows without changing stored values', () => {
    const values = new Map([
      ['quick-apps', '["Spotify","Terminal"]'],
      ['tasks', '["keep me"]'],
      ['workflows', '[{"name":"Work","urls":["Spotify","localhost:3000"]}]'],
      ['api-key', 'unchanged-secret'],
    ]);
    const store = createStorage({
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
    });
    expect(store.read('quick-apps', [])).toEqual(['Spotify', 'Terminal']);
    expect(store.read('tasks', [])).toEqual(['keep me']);
    expect(store.read('workflows', [])).toEqual([
      { name: 'Work', urls: ['Spotify', 'localhost:3000'] },
    ]);
    expect(store.getItem('api-key')).toBe('unchanged-secret');
    store.setItem('island-x', 50);
    expect(values.get('island-x')).toBe('50');
  });
  it('uses fallbacks for malformed collections while retaining the original stored value', () => {
    const values = new Map([['tasks', '{broken']]);
    const store = createStorage({
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
    });
    expect(store.read('tasks', [])).toEqual([]);
    expect(values.get('tasks')).toBe('{broken');
  });
});

describe('Island navigation and modes', () => {
  it('keeps configured order, hidden tabs and media availability', () => {
    const visible = visibleTabIds([7, 3, 0, 6, 1, 2, 4, 5], [1, 4], false);
    expect(visible).toEqual([7, 0, 6, 2, 5]);
    expect(nextTabId(visible, 5, 1)).toBe(7);
    expect(nextTabId(visible, 7, -1)).toBe(5);
    expect(visibleTabIds([3, 0], [], true)).toEqual([3, 0]);
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
