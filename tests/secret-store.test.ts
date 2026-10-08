import { existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { createAppStateStore } from '../src/main/services/appStateStore';
import { createSecretStore } from '../src/main/services/secretStore';

describe('encrypted API key storage', () => {
  it('persists safeStorage ciphertext in SQLite without a plaintext or sidecar key file', async () => {
    const userDataPath = await mkdtemp(path.join(tmpdir(), 'ripple-next-secret-'));
    const database = createAppStateStore(userDataPath);
    const encryptStringAsync = vi.fn(async (value: string) =>
      Buffer.from(Buffer.from(value).toString('base64')),
    );
    const decryptStringAsync = vi.fn(async (value: Buffer) => ({
      result: Buffer.from(value.toString(), 'base64').toString(),
      shouldReEncrypt: false,
    }));
    const crypto = {
      isAsyncEncryptionAvailable: async () => true,
      getSelectedStorageBackend: () => 'gnome_libsecret',
      encryptStringAsync,
      decryptStringAsync,
    };
    try {
      const store = createSecretStore(database, crypto);
      await store.setApiKey('sk-sensitive-value');

      const ciphertext = database.getSecretCiphertext('api-key');
      expect(ciphertext).not.toBeNull();
      expect(ciphertext?.toString()).not.toContain('sk-sensitive-value');
      expect(existsSync(path.join(userDataPath, 'credentials.bin'))).toBe(false);
      expect(await createSecretStore(database, crypto).getApiKey()).toBe('sk-sensitive-value');
      expect(await store.hasApiKey()).toBe(true);
    } finally {
      database.close();
      await rm(userDataPath, { recursive: true, force: true });
    }
  });

  it('refuses unavailable encryption without persisting a secret', async () => {
    const userDataPath = await mkdtemp(path.join(tmpdir(), 'ripple-next-secret-'));
    const database = createAppStateStore(userDataPath);
    const crypto = {
      isAsyncEncryptionAvailable: async () => false,
      encryptStringAsync: vi.fn(async (value: string) => Buffer.from(value)),
      decryptStringAsync: vi.fn(),
    };
    try {
      await expect(createSecretStore(database, crypto).setApiKey('sk-secret')).rejects.toThrow(
        'OS-backed secure storage is unavailable',
      );
      expect(database.hasSecret('api-key')).toBe(false);
      expect(existsSync(path.join(userDataPath, 'credentials.bin'))).toBe(false);
    } finally {
      database.close();
      await rm(userDataPath, { recursive: true, force: true });
    }
  });

  // Rejecting the weak backend is Linux-only; macOS and Windows never report
  // 'basic_text' and Electron exposes the backend query for Linux.
  it.runIf(process.platform === 'linux')(
    'refuses a weak Linux storage backend without persisting a secret',
    async () => {
      const userDataPath = await mkdtemp(path.join(tmpdir(), 'ripple-next-secret-'));
      const database = createAppStateStore(userDataPath);
      const crypto = {
        isAsyncEncryptionAvailable: async () => true,
        getSelectedStorageBackend: () => 'basic_text',
        encryptStringAsync: vi.fn(async (value: string) => Buffer.from(value)),
        decryptStringAsync: vi.fn(),
      };
      try {
        await expect(createSecretStore(database, crypto).setApiKey('sk-secret')).rejects.toThrow(
          'OS-backed secure storage is unavailable',
        );
        expect(database.hasSecret('api-key')).toBe(false);
        expect(existsSync(path.join(userDataPath, 'credentials.bin'))).toBe(false);
      } finally {
        database.close();
        await rm(userDataPath, { recursive: true, force: true });
      }
    },
  );
});
