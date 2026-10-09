import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const types: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.bmp': 'image/bmp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};
export function imageContentType(file: string) {
  return types[path.extname(file).toLowerCase()] ?? null;
}
function artworkContentType(buffer: Buffer) {
  if (buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])))
    return 'image/png';
  if (buffer.subarray(0, 3).equals(Buffer.from([255, 216, 255]))) return 'image/jpeg';
  if (['GIF87a', 'GIF89a'].includes(buffer.toString('ascii', 0, 6))) return 'image/gif';
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP')
    return 'image/webp';
  return null;
}
export async function mediaArtworkUrl(url: string): Promise<string | null> {
  if (!url) return null;
  if (!/^file:/i.test(url)) return url;
  let file: Awaited<ReturnType<typeof fs.open>> | undefined;
  try {
    const name = fileURLToPath(url);
    file = await fs.open(name, 'r');
    const stat = await file.stat();
    if (!stat.isFile() || stat.size > 5 * 1024 * 1024) return null;
    const buffer = Buffer.alloc(stat.size);
    let read = 0;
    while (read < buffer.length) {
      const result = await file.read(buffer, read, buffer.length - read, read);
      if (!result.bytesRead) break;
      read += result.bytesRead;
    }
    const contents = buffer.subarray(0, read);
    const mime = imageContentType(name) ?? artworkContentType(contents);
    return mime ? 'data:' + mime + ';base64,' + contents.toString('base64') : null;
  } catch {
    return null;
  } finally {
    await file?.close();
  }
}
