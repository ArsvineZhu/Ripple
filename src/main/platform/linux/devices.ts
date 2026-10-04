import { exec } from 'node:child_process';
export function getBluetoothStatus(): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    exec('bluetoothctl devices Connected', (error, stdout) => {
      if (error) return resolve(false);
      resolve(stdout.trim().length > 0);
    });
  });
}

export function getCameraStatus(): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    exec('fuser /dev/video* 2>/dev/null', (error, stdout) => {
      resolve(stdout.trim().length > 0);
    });
  });
}

export function getMicrophoneStatus(): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    exec("pactl list source-outputs | grep -q 'Source #'", (error) => {
      resolve(!error);
    });
  });
}
