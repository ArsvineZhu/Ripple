import { app } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
export const getIconPath = () => {
  const ext = 'png';
  if (app.isPackaged) {
    const resPath = path.join(process.resourcesPath, `icon.${ext}`);
    const assetsPath = path.join(process.resourcesPath, `assets/icons/icon.${ext}`);

    if (fs.existsSync(resPath)) return resPath;
    if (fs.existsSync(assetsPath)) return assetsPath;

    return resPath;
  }
  return path.join(__dirname, `../../src/assets/icons/icon.${ext}`);
};
