import { net, protocol } from 'electron';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  BACKGROUND_IMAGE_SCHEME,
  normalizeBackgroundImageInput,
} from '../../shared/backgroundImage';

const imageTypes: Record<string, string> = {
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

export function registerBackgroundImageScheme() {
  protocol.registerSchemesAsPrivileged([
    { scheme: BACKGROUND_IMAGE_SCHEME, privileges: { standard: true, secure: true } },
  ]);
}

export function installBackgroundImageProtocol(
  getConfiguredSource: () => Promise<string>,
  onError: (error: unknown) => void,
) {
  protocol.handle(BACKGROUND_IMAGE_SCHEME, async (request) => {
    try {
      const url = new URL(request.url);
      const source = url.searchParams.get('source');
      if (
        request.method !== 'GET' ||
        url.hostname !== 'image' ||
        url.pathname !== '/' ||
        !source ||
        source !== normalizeBackgroundImageInput(await getConfiguredSource())
      ) {
        return new Response(null, { status: 403 });
      }
      const filePath = /^file:/i.test(source)
        ? fileURLToPath(source)
        : /^~[\\/]/.test(source)
          ? path.join(os.homedir(), source.slice(2))
          : source;
      const contentType = imageTypes[path.extname(filePath).toLowerCase()];
      if (!path.isAbsolute(filePath) || !contentType) {
        return new Response(null, { status: 415 });
      }
      const response = await net.fetch(pathToFileURL(filePath).href);
      return new Response(response.body, {
        status: response.status,
        headers: { 'Content-Type': contentType, 'Cache-Control': 'no-store' },
      });
    } catch (error) {
      onError(error);
      return new Response(null, { status: 404 });
    }
  });
}
