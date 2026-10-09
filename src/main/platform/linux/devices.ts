import { readdir } from 'node:fs/promises';
import { z } from 'zod';
import { runCommand } from '../../services/processes';

let microphoneBackend: 'pactl' | 'pw-dump' = 'pactl';
const pipeWireObjects = z.array(
  z.object({
    type: z.string(),
    info: z
      .object({
        state: z.string().optional(),
        props: z.record(z.string(), z.unknown()).optional(),
      })
      .nullish(),
  }),
);

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
  if (microphoneBackend === 'pactl') {
    try {
      return /Source #/.test(await runCommand('pactl', ['list', 'source-outputs']));
    } catch (error) {
      if ((error as { code?: unknown })?.code !== 'ENOENT') throw error;
      microphoneBackend = 'pw-dump';
    }
  }
  const objects = pipeWireObjects.parse(JSON.parse(await runCommand('pw-dump', ['--no-colors'])));
  return objects.some(
    (object) =>
      object.type === 'PipeWire:Interface:Node' &&
      object.info?.state === 'running' &&
      object.info.props?.['media.class'] === 'Stream/Input/Audio',
  );
}
