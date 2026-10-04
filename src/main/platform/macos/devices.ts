import { exec } from 'node:child_process';
export function getBluetoothStatus(): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    exec('system_profiler SPBluetoothDataType -json', (error, stdout) => {
      if (error) return resolve(false);
      try {
        const data = JSON.parse(stdout);
        const bluetoothData = data.SPBluetoothDataType[0];
        const hasConnectedDevices =
          bluetoothData.device_connected && bluetoothData.device_connected.length > 0;
        resolve(hasConnectedDevices);
      } catch {
        resolve(false);
      }
    });
  });
}

export function getCameraStatus(): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    exec('ioreg -l | grep -E "FrontCameraActive|FrontCameraStreaming"', (error, stdout) => {
      resolve(stdout ? stdout.includes('= Yes') : false);
    });
  });
}

export function getMicrophoneStatus(): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    exec(
      'ioreg -l | grep -E "IOAudioStreamActive|IOAudioEngine|IOAudioStream" | grep -i "Yes"',
      (error, stdout) => {
        resolve(stdout ? stdout.trim().length > 0 : false);
      },
    );
  });
}
