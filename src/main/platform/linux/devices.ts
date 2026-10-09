import { readdir } from 'node:fs/promises';
import { runCommand } from '../../services/processes';

export async function getBluetoothStatus(): Promise<boolean> {
  return (await runCommand('bluetoothctl', ['devices', 'Connected'])).trim().length > 0;
}

export async function getCameraStatus(): Promise<boolean> {
  const devices = (await readdir('/dev'))
    .filter((name) => /^video\d+$/.test(name))
    .map((name) => '/dev/' + name);
  if (!devices.length) return false;
  try {
    return (await runCommand('fuser', devices)).trim().length > 0;
  } catch (error) {
    const result = error as { code?: unknown; stderr?: unknown };
    if (result.code === 1 && typeof result.stderr === 'string' && !result.stderr.trim())
      return false;
    throw error;
  }
}

export async function getMicrophoneStatus(): Promise<boolean> {
  return /Source #/.test(await runCommand('pactl', ['list', 'source-outputs']));
}
