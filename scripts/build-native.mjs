// Builds the macOS-only native window behaviour module. Windows and Linux have no native addon, so
// packaging and CI only print a line there. N-API keeps the binary loadable in any Electron version,
// which is why it is built against the running Node's headers instead of an Electron rebuild.
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

if (process.platform !== 'darwin') {
  console.log(`[native] skipped: ${process.platform} has no native window module`);
  process.exit(0);
}

const candidates = [
  path.resolve(
    path.dirname(process.execPath),
    '../lib/node_modules/npm/node_modules/node-gyp/bin/node-gyp.js',
  ),
  path.resolve(
    path.dirname(process.execPath),
    '../node_modules/npm/node_modules/node-gyp/bin/node-gyp.js',
  ),
];
const nodeGyp = candidates.find((candidate) => existsSync(candidate));
if (!nodeGyp) {
  console.error('[native] node-gyp not found next to this Node installation');
  process.exit(1);
}

// <installation>/bin/node -> the headers live in <installation>/include/node.
const nodeDir = path.resolve(process.execPath, '../..');
console.log(`[native] building native/macos-window against ${nodeDir}`);
execFileSync(process.execPath, [nodeGyp, 'rebuild', `--nodedir=${nodeDir}`], {
  cwd: path.resolve('native/macos-window'),
  stdio: 'inherit',
});
