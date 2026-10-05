import { execFile } from 'node:child_process';

export function launchApp(name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile('open', ['-a', name], (error) => {
      if (error)
        reject(new Error(`Could not launch application: ${error.message}`, { cause: error }));
      else resolve();
    });
  });
}
