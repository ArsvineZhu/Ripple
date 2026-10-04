import { exec } from 'node:child_process';
export function getBluetoothStatus(): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    const psScript = `@(Get-PnpDevice -Class Bluetooth -ErrorAction SilentlyContinue | Where-Object { $_.Status -eq 'OK' -and $_.Present -eq $true -and $_.InstanceId -match 'BTHENUM' }).Count -gt 0`;
    exec(`powershell -NoProfile -Command "${psScript}"`, (error, stdout) => {
      if (error) return resolve(false);
      resolve(stdout.trim().toLowerCase() === 'true');
    });
  });
}

export function getCameraStatus(): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    const psScript = `
        $inUse = $false
        $keys = Get-ChildItem -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\webcam" -Recurse -ErrorAction SilentlyContinue
        foreach ($key in $keys) {
            $val = Get-ItemProperty -Path $key.PSPath -Name "LastUsedTimeStop" -ErrorAction SilentlyContinue
            if ($val -and $val.LastUsedTimeStop -eq 0) {
                $inUse = $true
                break
            }
        }
        $inUse
      `;
    exec(`powershell -NoProfile -Command "${psScript}"`, (error, stdout) => {
      if (error) return resolve(false);
      resolve(stdout.trim().toLowerCase() === 'true');
    });
  });
}

export function getMicrophoneStatus(): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    const psScript = `@(Get-ChildItem -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\microphone" -Recurse -ErrorAction SilentlyContinue | ForEach-Object { Get-ItemProperty -Path $_.PSPath -Name "LastUsedTimeStop" -ErrorAction SilentlyContinue } | Where-Object { $_ -and $_.LastUsedTimeStop -eq 0 }).Count -gt 0`;
    exec(`powershell -NoProfile -Command "${psScript}"`, (error, stdout) => {
      if (error) return resolve(false);
      resolve(stdout.trim().toLowerCase() === 'true');
    });
  });
}
