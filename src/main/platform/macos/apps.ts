import { exec } from 'node:child_process';
export function launchApp(name: string): void {
  exec(`open -a "${name}"`);
}
