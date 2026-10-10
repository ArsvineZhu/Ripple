import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, expect, it, vi } from 'vitest';
import { configureApplicationProfile } from '../src/main/appProfile';

const directories: string[] = [];
afterEach(() => {
  for (const directory of directories.splice(0)) fs.rmSync(directory, { recursive: true });
});

it('keeps the packaged profile and isolates development state, caches and instance locks', () => {
  const appData = fs.mkdtempSync(path.join(os.tmpdir(), 'ripple-profile-'));
  directories.push(appData);
  const setPath = vi.fn();
  const app = { isPackaged: true, getPath: () => appData, setPath };
  const packaged = configureApplicationProfile(app);
  expect(packaged).toBe(path.join(appData, 'Ripple Next'));
  expect(setPath).toHaveBeenCalledWith('userData', packaged);
  expect(setPath).toHaveBeenCalledWith('sessionData', packaged);
  setPath.mockClear();
  const development = configureApplicationProfile({ ...app, isPackaged: false });
  expect(development).not.toBe(packaged);
  expect(setPath).toHaveBeenCalledWith('userData', development);
  expect(setPath).toHaveBeenCalledWith('sessionData', development);
  expect(fs.existsSync(development)).toBe(true);
});
