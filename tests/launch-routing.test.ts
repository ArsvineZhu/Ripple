import { afterEach, expect, it, vi } from 'vitest';
import { openApp } from '../src/renderer/lib/launch';

const openExternal = vi.fn();
const launchApp = vi.fn();
afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetAllMocks();
});
function bridge() {
  vi.stubGlobal('window', { electronAPI: { openExternal, launchApp } });
}
it.each([
  'localhost:3000',
  'localhost:3000/',
  'localhost:3000/admin?mode=dev#channels',
  'LOCALHOST:3000?debug=1',
  '127.0.0.1:3000/',
  '192.168.1.1/status',
])(
  'opens the local web address %s in the default browser instead of launching an application',
  async (address) => {
    bridge();
    await openApp('  ' + address + '  ');
    expect(openExternal).toHaveBeenCalledExactlyOnceWith('http://' + address);
    expect(launchApp).not.toHaveBeenCalled();
  },
);
it.each([
  'C:\\Tools\\browser.exe',
  '\\\\server\\apps\\tool.exe',
  '/usr/bin/firefox',
  './scripts/dev',
  '../tool/run',
  'tool.exe',
  'python3.11',
  'shell:AppsFolder\\org.App!Main',
  'Firefox',
])('retains application routing for %s', async (target) => {
  bridge();
  await openApp(target);
  expect(launchApp).toHaveBeenCalledExactlyOnceWith(target);
  expect(openExternal).not.toHaveBeenCalled();
});
it.each(['https://example.com/path', 'file:///tmp/folder'])(
  'retains explicit URL handling for %s',
  async (address) => {
    bridge();
    await openApp(address);
    expect(openExternal).toHaveBeenCalledExactlyOnceWith(address);
    expect(launchApp).not.toHaveBeenCalled();
  },
);
it('preserves an external-open failure for workflow feedback', async () => {
  bridge();
  openExternal.mockRejectedValueOnce(new Error('Browser unavailable'));
  await expect(openApp('localhost:3000/')).rejects.toThrow('Browser unavailable');
});
