import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { expect, it } from 'vitest';
import { mediaArtworkUrl } from '../src/main/services/imageFiles';
it('serves encoded local artwork, bounds reads, and isolates missing/unsupported covers', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'ripple-art-test-'));
  try {
    const file = path.join(directory, '封面 #1.png');
    await fs.writeFile(file, Buffer.from([137, 80, 78, 71]));
    expect(await mediaArtworkUrl(pathToFileURL(file).href)).toBe('data:image/png;base64,iVBORw==');
    expect(await mediaArtworkUrl('https://example.com/art.png')).toBe(
      'https://example.com/art.png',
    );
    expect(
      await mediaArtworkUrl(pathToFileURL(path.join(directory, 'missing.png')).href),
    ).toBeNull();
    expect(
      await mediaArtworkUrl(pathToFileURL(path.join(directory, 'script.txt')).href),
    ).toBeNull();
    const oversized = path.join(directory, 'large.png');
    const handle = await fs.open(oversized, 'w');
    await handle.truncate(5 * 1024 * 1024 + 1);
    await handle.close();
    expect(await mediaArtworkUrl(pathToFileURL(oversized).href)).toBeNull();
  } finally {
    for (const name of ['封面 #1.png', 'large.png'])
      await fs.unlink(path.join(directory, name)).catch(() => {});
    await fs.rmdir(directory);
  }
});
