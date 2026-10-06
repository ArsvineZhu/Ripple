import { app } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { getIconPath } from '../../assets';

function desktopExecArgument(value: string) {
  return `"${value.replaceAll('\\', '\\\\').replaceAll('"', '\\"').replaceAll('%', '%%')}"`;
}

export async function setAutoLaunch(enable: boolean): Promise<void> {
  const defaultConfigHome = path.join(app.getPath('home'), '.config');
  const configuredHome = process.env.XDG_CONFIG_HOME;
  const configHome =
    configuredHome && path.isAbsolute(configuredHome) ? configuredHome : defaultConfigHome;
  const autostartPath = path.join(configHome, 'autostart');
  const nextEntryPath = path.join(autostartPath, 'ripple-next.desktop');

  if (!enable) {
    await fs.rm(nextEntryPath, { force: true });
    return;
  }

  await fs.mkdir(autostartPath, { recursive: true });
  const temporaryPath = path.join(autostartPath, `.ripple-next.${randomUUID()}.tmp`);
  const content = `[Desktop Entry]
Type=Application
Version=1.0
Name=Ripple Next
StartupWMClass=ripple-next
Comment=Ripple Next Desktop Island
Exec=${desktopExecArgument(app.getPath('exe'))} --ozone-platform=x11
Icon=${getIconPath()}
Terminal=false
StartupNotify=false
`;
  await fs.writeFile(temporaryPath, content, { encoding: 'utf8', mode: 0o644, flag: 'wx' });
  try {
    await fs.rename(temporaryPath, nextEntryPath);
  } catch (error) {
    await fs.rm(temporaryPath, { force: true });
    throw error;
  }
}
