import { launchApp as macos } from '../platform/macos/apps';
import { launchApp as linux } from '../platform/linux/apps';
import type { AppEntry } from '../../shared/contracts';
import { app } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { buildCache, launchWindows } from '../platform/windows/apps';

export async function launchApp(appName: string): Promise<void> {
  switch (process.platform) {
    case 'darwin':
      macos(appName);
      break;
    case 'win32':
      launchWindows(appName);
      break;
    default:
      linux(appName);
  }
}
export async function buildAppCache(): Promise<void> {
  if (process.platform !== 'win32') return;
  const cacheFile = path.join(app.getPath('userData'), 'app-cache.json');
  try {
    const entries = await buildCache();
    fs.writeFileSync(cacheFile, JSON.stringify(entries));
  } catch {
    // Silently ignore cache build failures
  }
}
export async function searchApps(query: string): Promise<AppEntry[]> {
  if (process.platform !== 'win32' || !query) return [];
  const cacheFile = path.join(app.getPath('userData'), 'app-cache.json');
  try {
    if (!fs.existsSync(cacheFile)) return [];
    const data: AppEntry[] = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    const q = query.toLowerCase();
    return data.filter((a) => a.name && a.name.toLowerCase().includes(q)).slice(0, 8);
  } catch {
    return [];
  }
}
