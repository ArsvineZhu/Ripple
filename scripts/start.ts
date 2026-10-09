import path from 'node:path';

const electronArgs = process.argv.slice(2);

if (
  process.platform === 'linux' &&
  (process.env.XDG_SESSION_TYPE === 'wayland' || process.env.WAYLAND_DISPLAY)
) {
  electronArgs.unshift('--ozone-platform=x11');
}

// The CLI launches console commands to re-check pnpm configuration on every
// start. The start API keeps Windows development inside the invoking terminal.
void import('@electron-forge/core')
  .then(({ api }) => api.start({ dir: path.resolve(__dirname, '..'), args: electronArgs }))
  .then((child) => {
    child.on('error', (error) => {
      console.error('Failed to start Electron:', error);
      process.exitCode = 1;
    });
    child.on('exit', (code, signal) => {
      if (!child.restarted) process.exit(code ?? (signal ? 1 : 0));
    });
  })
  .catch((error) => {
    console.error('Failed to start Electron Forge:', error);
    process.exit(1);
  });
