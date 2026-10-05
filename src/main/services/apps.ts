import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { app, shell } from 'electron';
import { AppEntrySchema } from '../../shared/contracts';
import type { AppEntry, QuickAppTarget } from '../../shared/contracts';
import { launchLinuxDesktopEntry, discoverLinuxApps } from '../platform/linux/apps';
import { launchApp as launchMacApp } from '../platform/macos/apps';
import { buildCache, launchWindows, launchWindowsEntry } from '../platform/windows/apps';

function spawnDetached(executable: string, args: string[], workingDirectory?: string) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(executable, args, {
      ...(workingDirectory ? { cwd: workingDirectory } : {}),
      detached: true,
      stdio: 'ignore',
      shell: false,
    });
    child.once('error', (error) => {
      reject(new Error(`Could not start ${executable}: ${error.message}`, { cause: error }));
    });
    child.once('spawn', () => {
      child.unref();
      resolve();
    });
  });
}

export async function launchQuickApp(target: QuickAppTarget): Promise<void> {
  switch (target.kind) {
    case 'url':
      await shell.openExternal(target.url);
      return;
    case 'desktop-entry':
      if (process.platform !== 'linux')
        throw new TypeError('Desktop entries are only supported on Linux');
      await launchLinuxDesktopEntry(target.desktopFile);
      return;
    case 'command':
      await spawnDetached(target.executable, target.args, target.workingDirectory);
      return;
    case 'platform-app':
      if (target.platform !== process.platform) {
        throw new TypeError('This application target belongs to a different platform');
      }
      if (target.platform === 'win32') await launchWindowsEntry(target.identifier);
      else await launchMacApp(target.identifier);
  }
}

export async function launchApp(appName: string): Promise<void> {
  switch (process.platform) {
    case 'darwin':
      await launchMacApp(appName);
      break;
    case 'win32':
      launchWindows(appName);
      break;
    default: {
      const matches = await discoverLinuxApps(appName);
      const exactMatch = matches.find(
        (entry) => entry.name.toLocaleLowerCase() === appName.toLocaleLowerCase(),
      );
      if (exactMatch?.target.kind === 'desktop-entry') {
        await launchLinuxDesktopEntry(exactMatch.target.desktopFile);
      } else {
        await spawnDetached(appName, []);
      }
    }
  }
}

export async function buildAppCache(): Promise<void> {
  if (process.platform !== 'win32') return;
  const cacheFile = path.join(app.getPath('userData'), 'installed-apps.json');
  const entries = await buildCache();
  await fs.promises.mkdir(path.dirname(cacheFile), { recursive: true });
  await fs.promises.writeFile(cacheFile, JSON.stringify(entries), { mode: 0o600 });
}

export async function discoverApps(query: string): Promise<AppEntry[]> {
  const normalizedQuery = query.trim();
  if (process.platform === 'linux') return discoverLinuxApps(normalizedQuery);
  if (process.platform !== 'win32') return [];

  const cacheFile = path.join(app.getPath('userData'), 'installed-apps.json');
  try {
    const contents = await fs.promises.readFile(cacheFile, 'utf8');
    const data: unknown = JSON.parse(contents);
    if (!Array.isArray(data)) return [];
    const needle = normalizedQuery.toLocaleLowerCase();
    return data
      .flatMap((entry): AppEntry[] => {
        const parsed = AppEntrySchema.safeParse(entry);
        if (!parsed.success || !parsed.data.name.toLocaleLowerCase().includes(needle)) return [];
        return [parsed.data];
      })
      .slice(0, 20);
  } catch {
    return [];
  }
}
