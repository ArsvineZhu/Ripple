import { app } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { getIconPath } from '../../assets';
export function setAutoLaunch(enable: boolean): void {
  const autostartPath = path.join(app.getPath('home'), '.config', 'autostart');
  const desktopFilePath = path.join(autostartPath, 'ripple.desktop');

  try {
    if (enable) {
      if (!fs.existsSync(autostartPath)) {
        fs.mkdirSync(autostartPath, { recursive: true });
      }
      const desktopFileContent = `[Desktop Entry]
Type=Application
Version=1.0
Name=Ripple
Comment=Ripple Desktop Assistant
Exec="${app.getPath('exe')}" --ozone-platform=x11\nIcon=${getIconPath()}
Terminal=false
`;
      fs.writeFileSync(desktopFilePath, desktopFileContent);
    } else {
      if (fs.existsSync(desktopFilePath)) {
        fs.unlinkSync(desktopFilePath);
      }
    }
  } catch (e) {
    console.error('Failed to set auto-launch on Linux:', e);
  }
}
