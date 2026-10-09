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
export async function mediaArtworkUrl(url: string): Promise<string | null> {
  if (!url) return null;
  if (!/^file:/i.test(url)) return url;
  let file: Awaited<ReturnType<typeof fs.open>> | undefined;
  try {
    const name = fileURLToPath(url),
      mime = imageContentType(name);
    if (!mime) return null;
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
    return 'data:' + mime + ';base64,' + buffer.subarray(0, read).toString('base64');
  } catch {
    return null;
  } finally {
    await file?.close();
  }
}
