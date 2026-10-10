import fs from 'node:fs';
import path from 'node:path';

interface ProfileApplication {
  isPackaged: boolean;
  getPath(name: 'appData'): string;
  setPath(name: 'userData' | 'sessionData', value: string): void;
}

/** Set the profile before taking the single-instance lock or creating Chromium sessions. */
export function configureApplicationProfile(app: ProfileApplication): string {
  const userData = path.join(
    app.getPath('appData'),
    app.isPackaged ? 'Ripple Next' : 'Ripple Next Development',
  );
  fs.mkdirSync(userData, { recursive: true, mode: 0o700 });
  app.setPath('userData', userData);
  app.setPath('sessionData', userData);
  return userData;
}
